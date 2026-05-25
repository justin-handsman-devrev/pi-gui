use crate::file_ops::expand_tilde;
use crate::types::{BridgeState, PendingRequest, PiBridge, RpcCommand, RpcResponse};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

const EXTRA_PATHS: &[&str] = &[
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/opt/local/bin",
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
];

fn build_path_env() -> String {
    let inherited = std::env::var("PATH").unwrap_or_default();
    format!("{}:{}", EXTRA_PATHS.join(":"), inherited)
}

fn path_exists(path: &str) -> bool {
    Path::new(path).exists()
}

fn resolve_via_login_shell(binary: &str) -> Option<String> {
    let output = std::process::Command::new("/bin/zsh")
        .args(["-l", "-c", &format!("command -v {binary}")])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if path.is_empty() || !path_exists(&path) {
        return None;
    }

    Some(path)
}

fn resolve_binary(name: &str, candidates: &[&str]) -> Result<String, String> {
    if let Ok(path) = which::which(name) {
        let resolved = path.to_string_lossy().into_owned();
        if path_exists(&resolved) {
            return Ok(resolved);
        }
    }

    for candidate in candidates {
        if path_exists(candidate) {
            return Ok((*candidate).to_string());
        }
    }

    if let Some(path) = resolve_via_login_shell(name) {
        return Ok(path);
    }

    Err(format!("Could not find `{name}` binary on PATH."))
}

/// Resolve the full path to the `pi` CLI entrypoint.
fn resolve_pi_path() -> Result<String, String> {
    resolve_binary(
        "pi",
        &[
            "/opt/homebrew/bin/pi",
            "/usr/local/bin/pi",
            "/usr/bin/pi",
            "/opt/local/bin/pi",
            "/run/current-system/sw/bin/pi",
        ],
    )
    .map_err(|_| {
        "Could not find `pi`. Install @earendil-works/pi-coding-agent globally (npm install -g @earendil-works/pi-coding-agent) and ensure it is on PATH.".to_string()
    })
}

fn resolve_node_path() -> Result<String, String> {
    resolve_binary(
        "node",
        &[
            "/opt/homebrew/bin/node",
            "/usr/local/bin/node",
            "/usr/bin/node",
            "/opt/local/bin/node",
        ],
    )
    .map_err(|_| {
        "Could not find `node`. Pi is installed as a Node.js CLI — install Node.js and ensure `node` is on PATH.".to_string()
    })
}

struct PiLaunch {
    program: String,
    args: Vec<String>,
}

/// npm global installs expose `pi` as a Node script; spawn node directly so GUI apps
/// don't depend on `#!/usr/bin/env node` resolving in a stripped-down PATH.
fn resolve_pi_launch() -> Result<PiLaunch, String> {
    let pi_path = resolve_pi_path()?;
    let canonical = PathBuf::from(&pi_path)
        .canonicalize()
        .unwrap_or_else(|_| PathBuf::from(&pi_path));

    let rpc_args = vec!["--mode".to_string(), "rpc".to_string()];

    if canonical.extension().and_then(|ext| ext.to_str()) == Some("js") {
        let node = resolve_node_path()?;
        let mut args = vec![canonical.to_string_lossy().into_owned()];
        args.extend(rpc_args);
        return Ok(PiLaunch { program: node, args });
    }

    Ok(PiLaunch {
        program: pi_path,
        args: rpc_args,
    })
}

fn validate_project_dir(cwd: &str) -> Result<PathBuf, String> {
    let resolved = expand_tilde(cwd);
    if !resolved.is_dir() {
        return Err(format!(
            "Project directory does not exist: {}. Use Browse to pick a folder or enter a valid path.",
            resolved.display()
        ));
    }
    Ok(resolved)
}

impl PiBridge {
    /// Spawn the pi agent process and start the stdout reader task.
    pub async fn start(
        app: tauri::AppHandle,
        cwd: &str,
    ) -> Result<Self, String> {
        let cwd = validate_project_dir(cwd)?;
        let launch = resolve_pi_launch()?;
        let full_path = build_path_env();
        let home = std::env::var("HOME").unwrap_or_else(|_| "/".into());

        let mut command = tokio::process::Command::new(&launch.program);
        command
            .args(&launch.args)
            .current_dir(&cwd)
            .env("PATH", &full_path)
            .env("HOME", &home)
            .env("TERM", "xterm-256color")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        let mut child = command.spawn().map_err(|e| {
            format!(
                "Failed to start pi ({} {}): {e}. Ensure `pi` and `node` are installed and the project folder exists.",
                launch.program,
                launch.args.join(" ")
            )
        })?;

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

    pub async fn prompt(
        &self,
        message: String,
        images: Option<Vec<crate::types::ImageContent>>,
    ) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::Prompt { message, images })
            .await
    }

    pub async fn steer(
        &self,
        message: String,
        images: Option<Vec<crate::types::ImageContent>>,
    ) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::Steer { message, images })
            .await
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

    pub async fn switch_session(&self, session_path: String) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::SwitchSession { session_path })
            .await
    }

    pub async fn get_messages(&self) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::GetMessages).await
    }

    pub async fn get_session_stats(&self) -> Result<RpcResponse, String> {
        self.send_command(RpcCommand::GetSessionStats).await
    }

    /// Kill the child process.
    pub async fn stop(&self) -> Result<(), String> {
        let mut child = self.child.lock().await;
        child.kill().await.map_err(|e| format!("Failed to kill pi process: {e}"))
    }
}

// Expose a safe newtype for Tauri managed state.
pub type PiBridgeState = tokio::sync::Mutex<BridgeState>;
