use crate::types::{BridgeState, PendingRequest, PiBridge, RpcCommand, RpcResponse};
use std::collections::HashMap;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

impl PiBridge {
    /// Spawn the pi agent process and start the stdout reader task.
    pub async fn start(
        app: tauri::AppHandle,
        cwd: &str,
    ) -> Result<Self, String> {
        let mut child = tokio::process::Command::new("pi")
            .arg("--rpc")
            .current_dir(cwd)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn pi --rpc: {e}"))?;

        let stdin = child
            .stdin
            .take()
            .ok_or("Failed to acquire stdin of child process")?;
        let stdout = child
            .stdout
            .take()
            .ok_or("Failed to acquire stdout of child process")?;

        let pending: Arc<tokio::sync::Mutex<HashMap<String, PendingRequest>>> =
            Arc::new(tokio::sync::Mutex::new(HashMap::new()));
        let next_id = Arc::new(std::sync::atomic::AtomicU64::new(1));

        // Spawn the stdout reader task.
        let reader_pending = pending.clone();
        let reader_app = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }

                let value: serde_json::Value = match serde_json::from_str(trimmed) {
                    Ok(v) => v,
                    Err(e) => {
                        eprintln!("[pi-bridge] Failed to parse JSON from pi: {e}");
                        continue;
                    }
                };

                // Check if this is a response to a pending command.
                let type_field = value.get("type").and_then(|v| v.as_str()).unwrap_or("");

                if type_field == "response" {
                    let id = value
                        .get("id")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();

                    let rpc_resp: RpcResponse = match serde_json::from_value(value) {
                        Ok(r) => r,
                        Err(e) => {
                            eprintln!("[pi-bridge] Failed to deserialize response: {e}");
                            continue;
                        }
                    };

                    let mut map = reader_pending.lock().await;
                    if let Some(pending_req) = map.remove(&id) {
                        if pending_req.tx.send(rpc_resp).is_err() {
                            eprintln!("[pi-bridge] Response channel closed for id={id}");
                        }
                    }
                } else {
                    // It's an agent event — emit to all windows.
                    if let Err(e) = reader_app.emit("agent-event", &value) {
                        eprintln!("[pi-bridge] Failed to emit agent-event: {e}");
                    }
                }
            }

            eprintln!("[pi-bridge] stdout reader task ended");
        });

        Ok(Self {
            stdin_tx: tokio::sync::Mutex::new(stdin),
            pending,
            child: tokio::sync::Mutex::new(child),
            next_id,
        })
    }

    /// Allocate a new unique request ID.
    fn allocate_id(&self) -> String {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);
        format!("req-{id}")
    }

    /// Send a command and wait for the response (with a 120s timeout).
    pub async fn send_command(&self, cmd: RpcCommand) -> Result<RpcResponse, String> {
        let id = self.allocate_id();

        // Build the JSON value with the id injected.
        let mut value = serde_json::to_value(&cmd)
            .map_err(|e| format!("Failed to serialize command: {e}"))?;

        let obj = value
            .as_object_mut()
            .ok_or("Command did not serialize to an object")?;
        obj.insert("id".into(), serde_json::Value::String(id.clone()));

        let json_line = serde_json::to_string(&obj)
            .map_err(|e| format!("Failed to re-serialize command: {e}"))?;

        // Register the pending request before writing.
        let (tx, rx) = tokio::sync::oneshot::channel();
        {
            let mut map = self.pending.lock().await;
            map.insert(id.clone(), PendingRequest { tx });
        }

        // Write to stdin.
        {
            let mut stdin = self.stdin_tx.lock().await;
            stdin
                .write_all(format!("{json_line}\n").as_bytes())
                .await
                .map_err(|e| format!("Failed to write to stdin: {e}"))?;
            stdin
                .flush()
                .await
                .map_err(|e| format!("Failed to flush stdin: {e}"))?;
        }

        // Await response with timeout.
        tokio::time::timeout(std::time::Duration::from_secs(120), rx)
            .await
            .map_err(|_| {
                // Clean up pending map on timeout.
                let id_clone = id.clone();
                let pending = self.pending.clone();
                tokio::spawn(async move {
                    let mut map = pending.lock().await;
                    map.remove(&id_clone);
                });
                format!("Timeout waiting for response to command (id={id})")
            })?
            .map_err(|_| format!("Response channel dropped for command (id={id})"))
    }

    // ── Convenience methods ────────────────────────────────────────

    pub async fn prompt(&self, message: String) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::Prompt {
            message,
            images: None,
        })
        .await
    }

    pub async fn steer(&self, message: String) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::Steer { message }).await
    }

    pub async fn abort(&self) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::Abort).await
    }

    pub async fn new_session(&self) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::NewSession {
            parent_session: None,
        })
        .await
    }

    pub async fn get_state(&self) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::GetState).await
    }

    pub async fn set_model(&self, provider: String, model_id: String) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::SetModel {
            provider,
            model_id,
        })
        .await
    }

    pub async fn get_available_models(&self) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::GetAvailableModels).await
    }

    pub async fn set_thinking_level(&self, level: String) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::SetThinkingLevel { level }).await
    }

    pub async fn compact(&self) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::Compact {
            custom_instructions: None,
        })
        .await
    }

    /// Kill the child process.
    pub async fn stop(&self) -> Result<(), String> {
        let mut child = self.child.lock().await;
        child.kill().await.map_err(|e| format!("Failed to kill pi process: {e}"))
    }
}

// Expose a safe newtype for Tauri managed state.
pub type PiBridgeState = tokio::sync::Mutex<BridgeState>;
