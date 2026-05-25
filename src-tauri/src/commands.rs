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
    images: Option<Vec<crate::types::ImageContent>>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.prompt(message, images).await?;
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
    images: Option<Vec<crate::types::ImageContent>>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.steer(message, images).await?;
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

#[tauri::command]
pub async fn switch_session(
    state: tauri::State<'_, PiBridgeState>,
    session_path: String,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.switch_session(session_path).await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn get_messages(
    state: tauri::State<'_, PiBridgeState>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.get_messages().await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn get_session_stats(
    state: tauri::State<'_, PiBridgeState>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.get_session_stats().await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub async fn get_commands(
    state: tauri::State<'_, PiBridgeState>,
) -> Result<serde_json::Value, String> {
    let guard = state.lock().await;
    let bridge = guard.bridge.as_ref().ok_or("Agent not started")?;
    let resp = bridge.get_commands().await?;
    if resp.success {
        Ok(resp.data.unwrap_or(serde_json::Value::Null))
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

#[tauri::command]
pub fn resolve_session_path(
    session_arg: String,
    cwd_hint: Option<String>,
) -> Result<String, String> {
    crate::session_paths::resolve_session_path(
        &session_arg,
        cwd_hint.as_deref(),
    )
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<crate::file_ops::DirEntry>, String> {
    crate::file_ops::list_directory(&path)
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    crate::file_ops::read_text_file(&path)
}

#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    crate::file_ops::write_text_file(&path, &content)
}

#[tauri::command]
pub fn list_scheduled_jobs() -> Result<Vec<crate::cron::ScheduledJob>, String> {
    crate::cron::list_scheduled_jobs()
}

#[tauri::command]
pub fn upsert_scheduled_job(job: crate::cron::ScheduledJob) -> Result<crate::cron::ScheduledJob, String> {
    crate::cron::upsert_scheduled_job(job)
}

#[tauri::command]
pub fn delete_scheduled_job(id: String) -> Result<(), String> {
    crate::cron::delete_scheduled_job(id)
}

#[tauri::command]
pub fn set_scheduled_job_enabled(
    id: String,
    enabled: bool,
) -> Result<crate::cron::ScheduledJob, String> {
    crate::cron::set_scheduled_job_enabled(id, enabled)
}

#[tauri::command]
pub fn git_status(cwd: String) -> Result<crate::git_ops::GitStatusResult, String> {
    crate::git_ops::git_status(&cwd)
}

#[tauri::command]
pub fn git_diff(cwd: String, path: String, staged: bool) -> Result<String, String> {
    crate::git_ops::git_diff(&cwd, &path, staged)
}

#[tauri::command]
pub fn git_stage(cwd: String, paths: Vec<String>) -> Result<(), String> {
    crate::git_ops::git_stage(&cwd, paths)
}

#[tauri::command]
pub fn git_unstage(cwd: String, paths: Vec<String>) -> Result<(), String> {
    crate::git_ops::git_unstage(&cwd, paths)
}

#[tauri::command]
pub fn git_discard(cwd: String, path: String) -> Result<(), String> {
    crate::git_ops::git_discard(&cwd, &path)
}

#[tauri::command]
pub fn git_commit(cwd: String, message: String) -> Result<(), String> {
    crate::git_ops::git_commit(&cwd, &message)
}

#[tauri::command]
pub fn git_log(cwd: String, limit: u32) -> Result<Vec<crate::git_ops::GitCommitEntry>, String> {
    crate::git_ops::git_log(&cwd, limit)
}

#[tauri::command]
pub fn list_installed_skills(
    project_cwd: Option<String>,
    include_internal: bool,
) -> Result<crate::skills::SkillsListResult, String> {
    crate::skills::list_installed_skills(project_cwd, include_internal)
}

#[tauri::command]
pub fn set_skill_enabled(skill_dir: String, enabled: bool) -> Result<(), String> {
    crate::skills::set_skill_enabled(skill_dir, enabled)
}

#[tauri::command]
pub fn read_skill_content(skill_md_path: String) -> Result<String, String> {
    crate::skills::read_skill_content(skill_md_path)
}

#[tauri::command]
pub fn write_skill_content(skill_md_path: String, content: String) -> Result<(), String> {
    crate::skills::write_skill_content(skill_md_path, content)
}

#[tauri::command]
pub fn skills_cli_add(
    source: String,
    project_cwd: Option<String>,
    global: bool,
    agent: String,
    skills: Option<Vec<String>>,
    copy: bool,
) -> Result<crate::skills::SkillsCliResult, String> {
    crate::skills::skills_cli_add(source, project_cwd, global, agent, skills, copy)
}

#[tauri::command]
pub fn skills_cli_list(
    project_cwd: Option<String>,
    global: bool,
    agent: Option<String>,
) -> Result<crate::skills::SkillsCliResult, String> {
    crate::skills::skills_cli_list(project_cwd, global, agent)
}

#[tauri::command]
pub fn skills_cli_list_remote(source: String) -> Result<crate::skills::SkillsCliResult, String> {
    crate::skills::skills_cli_list_remote(source)
}

#[tauri::command]
pub fn skills_cli_find(query: Option<String>) -> Result<crate::skills::SkillsCliResult, String> {
    crate::skills::skills_cli_find(query)
}

#[tauri::command]
pub fn skills_cli_remove(
    skill_names: Vec<String>,
    project_cwd: Option<String>,
    global: bool,
    agent: Option<String>,
) -> Result<crate::skills::SkillsCliResult, String> {
    crate::skills::skills_cli_remove(skill_names, project_cwd, global, agent)
}

#[tauri::command]
pub fn skills_cli_update(
    project_cwd: Option<String>,
    global: bool,
    skill_names: Option<Vec<String>>,
) -> Result<crate::skills::SkillsCliResult, String> {
    crate::skills::skills_cli_update(project_cwd, global, skill_names)
}

#[tauri::command]
pub fn skills_cli_init(
    name: Option<String>,
    project_cwd: Option<String>,
) -> Result<crate::skills::SkillsCliResult, String> {
    crate::skills::skills_cli_init(name, project_cwd)
}
