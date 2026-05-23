use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// An image attached to a prompt.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageContent {
    #[serde(rename = "type")]
    pub content_type: String, // always "image"
    pub data: String,
    #[serde(rename = "mediaType")]
    pub media_type: String,
}

/// Model info returned by get_available_models.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub provider: String,
    pub id: String,
    #[serde(rename = "contextWindow")]
    pub context_window: i64,
    pub reasoning: bool,
}

/// Session state returned by get_state.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcSessionState {
    pub model: Option<ModelRef>,
    #[serde(rename = "thinkingLevel")]
    pub thinking_level: String,
    #[serde(rename = "isStreaming")]
    pub is_streaming: bool,
    #[serde(rename = "isCompacting")]
    pub is_compacting: bool,
    #[serde(rename = "steeringMode")]
    pub steering_mode: String,
    #[serde(rename = "followUpMode")]
    pub follow_up_mode: String,
    #[serde(rename = "sessionFile")]
    pub session_file: Option<String>,
    #[serde(rename = "sessionId")]
    pub session_id: String,
    #[serde(rename = "sessionName")]
    pub session_name: Option<String>,
    #[serde(rename = "autoCompactionEnabled")]
    pub auto_compaction_enabled: bool,
    #[serde(rename = "messageCount")]
    pub message_count: i64,
    #[serde(rename = "pendingMessageCount")]
    pub pending_message_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRef {
    pub provider: String,
    pub id: String,
}

// ── RPC Commands ──────────────────────────────────────────────────────

/// Commands sent to the pi agent over stdin.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RpcCommand {
    Prompt {
        message: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        images: Option<Vec<ImageContent>>,
    },
    Steer {
        message: String,
    },
    Abort,
    NewSession {
        #[serde(rename = "parentSession", skip_serializing_if = "Option::is_none")]
        parent_session: Option<String>,
    },
    GetState,
    SetModel {
        provider: String,
        #[serde(rename = "modelId")]
        model_id: String,
    },
    GetAvailableModels,
    SetThinkingLevel {
        level: String,
    },
    Compact {
        #[serde(rename = "customInstructions", skip_serializing_if = "Option::is_none")]
        custom_instructions: Option<String>,
    },
}

// ── RPC Responses ─────────────────────────────────────────────────────

/// Envelope for responses that come back from the pi agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcResponse {
    #[serde(rename = "type")]
    pub resp_type: String, // always "response"
    pub command: String,
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

// ── Agent Events ──────────────────────────────────────────────────────

/// Events streamed by the pi agent on stdout.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AgentEvent {
    AgentStart,
    MessageStart {
        message: serde_json::Value,
    },
    MessageUpdate {
        message: serde_json::Value,
    },
    MessageEnd {
        message: serde_json::Value,
    },
    ToolExecutionStart {
        #[serde(rename = "toolCallId")]
        tool_call_id: String,
        #[serde(rename = "toolName")]
        tool_name: String,
        args: serde_json::Value,
    },
    ToolExecutionUpdate {
        #[serde(rename = "toolCallId")]
        tool_call_id: String,
        #[serde(rename = "toolName")]
        tool_name: String,
        args: serde_json::Value,
        #[serde(rename = "partialResult")]
        partial_result: serde_json::Value,
    },
    ToolExecutionEnd {
        #[serde(rename = "toolCallId")]
        tool_call_id: String,
        #[serde(rename = "toolName")]
        tool_name: String,
        result: serde_json::Value,
        #[serde(rename = "isError")]
        is_error: bool,
    },
    TurnStart,
    TurnEnd {
        message: serde_json::Value,
        #[serde(rename = "toolResults")]
        tool_results: serde_json::Value,
    },
    AgentEnd {
        messages: serde_json::Value,
    },
    QueueUpdate {
        #[serde(rename = "queueLength")]
        queue_length: serde_json::Value,
    },
    CompactionStart,
    CompactionEnd,
    ExtensionUiRequest {
        #[serde(rename = "requestId")]
        request_id: String,
        data: serde_json::Value,
    },
    ExtensionError {
        error: String,
    },
    ThinkingLevelChanged {
        level: String,
    },
    SessionInfoChanged {
        info: serde_json::Value,
    },
    AutoRetryStart,
    AutoRetryEnd,
}

// ── Wrapper for extension UI request responses ────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionUiResponse {
    #[serde(rename = "requestId")]
    pub request_id: String,
    pub data: serde_json::Value,
}

// ── Internal state types ──────────────────────────────────────────────

/// Pending request tracked by ID.
pub struct PendingRequest {
    pub tx: tokio::sync::oneshot::Sender<RpcResponse>,
}

/// State shared between Tauri commands and the bridge.
pub struct BridgeState {
    pub bridge: Option<PiBridge>,
}

/// The running bridge handle. Stores the child process and pending map.
pub struct PiBridge {
    pub stdin_tx: tokio::sync::Mutex<tokio::process::ChildStdin>,
    pub pending: std::sync::Arc<tokio::sync::Mutex<HashMap<String, PendingRequest>>>,
    pub child: tokio::sync::Mutex<tokio::process::Child>,
    pub next_id: std::sync::Arc<std::sync::atomic::AtomicU64>,
}
