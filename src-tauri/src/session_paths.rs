use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

fn default_agent_dir() -> PathBuf {
    crate::file_ops::expand_tilde("~/.pi/agent")
}

fn encode_session_dir(cwd: &str) -> PathBuf {
    let resolved = crate::file_ops::expand_tilde(cwd);
    let resolved_str = resolved.to_string_lossy();
    let trimmed = resolved_str
        .trim_start_matches('/')
        .trim_start_matches('\\');
    let safe = format!(
        "--{}--",
        trimmed.replace(['/', '\\', ':'], "-")
    );
    default_agent_dir().join("sessions").join(safe)
}

fn read_session_id_from_file(path: &Path) -> Option<String> {
    let file = File::open(path).ok()?;
    let mut reader = BufReader::new(file);
    let mut line = String::new();
    reader.read_line(&mut line).ok()?;
    let entry: serde_json::Value = serde_json::from_str(line.trim()).ok()?;
    if entry.get("type")?.as_str()? == "session" {
        return entry.get("id")?.as_str().map(String::from);
    }
    None
}

fn find_session_in_dir(dir: &Path, session_arg: &str) -> Option<PathBuf> {
    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
            continue;
        }
        if let Some(id) = read_session_id_from_file(&path) {
            if id.starts_with(session_arg) || id == session_arg {
                return Some(path);
            }
        }
    }
    None
}

fn looks_like_path(session_arg: &str) -> bool {
    session_arg.contains('/')
        || session_arg.contains('\\')
        || session_arg.ends_with(".jsonl")
}

/// Resolve a session file path from a path or partial session UUID (mirrors pi CLI).
pub fn resolve_session_path(session_arg: &str, cwd_hint: Option<&str>) -> Result<String, String> {
    let session_arg = session_arg.trim();
    if session_arg.is_empty() {
        return Err("Session path or id is required".into());
    }

    if looks_like_path(session_arg) {
        return Ok(crate::file_ops::expand_tilde(session_arg)
            .to_string_lossy()
            .to_string());
    }

    if let Some(cwd) = cwd_hint.filter(|c| !c.is_empty()) {
        let dir = encode_session_dir(cwd);
        if dir.exists() {
            if let Some(path) = find_session_in_dir(&dir, session_arg) {
                return Ok(path.to_string_lossy().to_string());
            }
        }
    }

    let sessions_dir = default_agent_dir().join("sessions");
    if sessions_dir.exists() {
        for entry in fs::read_dir(&sessions_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            if !entry.path().is_dir() {
                continue;
            }
            if let Some(path) = find_session_in_dir(&entry.path(), session_arg) {
                return Ok(path.to_string_lossy().to_string());
            }
        }
    }

    Err(format!("No session found matching '{session_arg}'"))
}
