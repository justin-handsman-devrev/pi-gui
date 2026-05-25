use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};

const MARKER_PREFIX: &str = "pi-gui:";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduledJob {
    pub id: String,
    pub name: String,
    pub prompt: String,
    pub cwd: String,
    pub schedule: String,
    pub enabled: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct JobStore {
    jobs: Vec<ScheduledJob>,
}

fn app_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
    Ok(PathBuf::from(home).join(".pi-gui"))
}

fn jobs_file() -> Result<PathBuf, String> {
    Ok(app_dir()?.join("scheduled-jobs.json"))
}

fn logs_dir() -> Result<PathBuf, String> {
    Ok(app_dir()?.join("logs"))
}

fn ensure_dirs() -> Result<(), String> {
    let dir = app_dir()?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create {}: {e}", dir.display()))?;
    fs::create_dir_all(logs_dir()?).map_err(|e| format!("Failed to create logs dir: {e}"))?;
    Ok(())
}

fn read_store() -> Result<JobStore, String> {
    ensure_dirs()?;
    let path = jobs_file()?;
    if !path.exists() {
        return Ok(JobStore { jobs: vec![] });
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Failed to read jobs file: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Failed to parse jobs file: {e}"))
}

fn write_store(store: &JobStore) -> Result<(), String> {
    ensure_dirs()?;
    let path = jobs_file()?;
    let raw = serde_json::to_string_pretty(store)
        .map_err(|e| format!("Failed to serialize jobs: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("Failed to write jobs file: {e}"))
}

fn resolve_pi_binary() -> Result<String, String> {
    which::which("pi")
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(|_| "Could not find `pi` on PATH. Install the pi coding agent CLI.".to_string())
}

fn shell_single_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\"'\"'"))
}

fn validate_cron_expression(schedule: &str) -> Result<(), String> {
    let parts: Vec<&str> = schedule.split_whitespace().collect();
    if parts.len() != 5 {
        return Err("Cron schedule must have 5 fields: minute hour day month weekday".into());
    }
    Ok(())
}

fn job_marker(id: &str) -> String {
    format!("{MARKER_PREFIX}{id}")
}

fn build_crontab_line(job: &ScheduledJob, pi_path: &str) -> Result<String, String> {
    validate_cron_expression(&job.schedule)?;
    let log_path = logs_dir()?.join(format!("{}.log", job.id));
    let command = format!(
        "cd {} && {} -p {} >> {} 2>&1",
        shell_single_quote(&job.cwd),
        shell_single_quote(pi_path),
        shell_single_quote(&job.prompt),
        shell_single_quote(&log_path.to_string_lossy()),
    );
    Ok(format!(
        "{} {} # {}",
        job.schedule,
        command,
        job_marker(&job.id)
    ))
}

fn read_user_crontab() -> Result<String, String> {
    let output = Command::new("crontab")
        .arg("-l")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to run crontab -l: {e}"))?;

    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).into_owned());
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    if stderr.contains("no crontab") {
        return Ok(String::new());
    }

    Err(format!("crontab -l failed: {stderr}"))
}

fn write_user_crontab(contents: &str) -> Result<(), String> {
    let mut child = Command::new("crontab")
        .arg("-")
        .stdin(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run crontab -: {e}"))?;

    use std::io::Write;
    if let Some(stdin) = child.stdin.as_mut() {
        stdin
            .write_all(contents.as_bytes())
            .map_err(|e| format!("Failed to write crontab stdin: {e}"))?;
    }

    let status = child
        .wait()
        .map_err(|e| format!("Failed waiting for crontab: {e}"))?;

    if status.success() {
        Ok(())
    } else {
        Err("crontab rejected the updated schedule".into())
    }
}

fn strip_managed_lines(crontab: &str) -> Vec<String> {
    crontab
        .lines()
        .filter(|line| !line.contains(MARKER_PREFIX))
        .map(str::to_string)
        .collect()
}

fn sync_crontab(jobs: &[ScheduledJob]) -> Result<(), String> {
    let pi_path = resolve_pi_binary()?;
    let mut lines = strip_managed_lines(&read_user_crontab()?);

    while lines.last().is_some_and(|line| line.trim().is_empty()) {
        lines.pop();
    }

    for job in jobs.iter().filter(|job| job.enabled) {
        lines.push(build_crontab_line(job, &pi_path)?);
    }

    let mut body = lines.join("\n");
    if !body.is_empty() {
        body.push('\n');
    }

    write_user_crontab(&body)
}

pub fn list_scheduled_jobs() -> Result<Vec<ScheduledJob>, String> {
    let store = read_store()?;
    Ok(store.jobs)
}

pub fn upsert_scheduled_job(job: ScheduledJob) -> Result<ScheduledJob, String> {
    validate_cron_expression(&job.schedule)?;
    if job.prompt.trim().is_empty() {
        return Err("Prompt is required".into());
    }
    if job.cwd.trim().is_empty() {
        return Err("Project directory is required".into());
    }

    let mut store = read_store()?;
    if let Some(existing) = store.jobs.iter_mut().find(|entry| entry.id == job.id) {
        *existing = job.clone();
    } else {
        store.jobs.push(job.clone());
    }
    store.jobs.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    write_store(&store)?;
    sync_crontab(&store.jobs)?;
    Ok(job)
}

pub fn delete_scheduled_job(id: String) -> Result<(), String> {
    let mut store = read_store()?;
    store.jobs.retain(|job| job.id != id);
    write_store(&store)?;
    sync_crontab(&store.jobs)?;

    if let Ok(log_path) = logs_dir().map(|dir| dir.join(format!("{id}.log"))) {
        let _ = fs::remove_file(log_path);
    }

    Ok(())
}

pub fn set_scheduled_job_enabled(id: String, enabled: bool) -> Result<ScheduledJob, String> {
    let mut store = read_store()?;
    let job = store
        .jobs
        .iter_mut()
        .find(|job| job.id == id)
        .ok_or_else(|| format!("Scheduled job not found: {id}"))?;
    job.enabled = enabled;
    job.updated_at = now_ms();
    let updated = job.clone();
    write_store(&store)?;
    sync_crontab(&store.jobs)?;
    Ok(updated)
}

pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
