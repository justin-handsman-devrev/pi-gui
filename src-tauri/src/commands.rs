use crate::rpc_bridge::PiBridgeState;

#[tauri::command]
pub async fn start_agent(
    app: tauri::AppHandle,
    state: tauri::State<'_, PiBridgeState>,
    cwd: String,
) -> Result<(), String> {
    let bridge = crate::types::PiBridge::start(app, &cwd).await?;
    let mut guard = state.lock().await;
    // Stop any existing bridge first.
    if let Some(old) = guard.bridge.take() {
        let _ = old.stop().await;
    }
    guard.bridge = Some(bridge);
    Ok(())
}

#[tauri::command]
pub async fn send_prompt(
    state: tauri::State<'_, PiBridgeState>,
    message: String,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.prompt(message).await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn steer(
    state: tauri::State<'_, PiBridgeState>,
    message: String,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.steer(message).await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn abort_agent(
    state: tauri::State<'_, PiBridgeState>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.abort().await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn new_session(
    state: tauri::State<'_, PiBridgeState>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.new_session().await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn get_state(
    state: tauri::State<'_, PiBridgeState>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.get_state().await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn set_model(
    state: tauri::State<'_, PiBridgeState>,
    provider: String,
    model_id: String,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.set_model(provider, model_id).await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn get_available_models(
    state: tauri::State<'_, PiBridgeState>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.get_available_models().await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn set_thinking_level(
    state: tauri::State<'_, PiBridgeState>,
    level: String,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.set_thinking_level(level).await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn compact_session(
    state: tauri::State<'_, PiBridgeState>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.compact().await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}
