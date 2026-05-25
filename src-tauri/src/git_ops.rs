use crate::file_ops::expand_tilde;
use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitFileStatus {
    pub path: String,
    pub index_status: String,
    pub worktree_status: String,
    pub staged: bool,
    pub unstaged: bool,
    pub untracked: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatusResult {
    pub is_repo: bool,
    pub repo_root: String,
    pub branch: String,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub files: Vec<GitFileStatus>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitEntry {
    pub hash: String,
    pub subject: String,
    pub author: String,
    pub relative_date: String,
}

fn resolve_repo(cwd: &str) -> Result<PathBuf, String> {
    let path = expand_tilde(cwd);
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", path.display()));
    }
    Ok(path)
}

fn run_git(cwd: &PathBuf, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("Failed to run git: {e}"))?;

    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).into_owned());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    Err(if stderr.is_empty() {
        format!("git {} failed", args.join(" "))
    } else {
        stderr
    })
}

fn repo_root(cwd: &PathBuf) -> Result<PathBuf, String> {
    let root = run_git(cwd, &["rev-parse", "--show-toplevel"])?.trim().to_string();
    Ok(PathBuf::from(root))
}

fn parse_branch_line(line: &str) -> (String, Option<String>, u32, u32) {
    let mut branch = "HEAD".to_string();
    let mut upstream = None;
    let mut ahead = 0;
    let mut behind = 0;

    let rest = line.strip_prefix("## ").unwrap_or(line);
    let (head, tracking) = match rest.split_once("...") {
        Some((left, right)) => (left.trim(), Some(right.trim())),
        None => (rest.trim(), None),
    };

    if !head.is_empty() {
        branch = head.to_string();
    }

    if let Some(track) = tracking {
        let mut track_name = track.to_string();
        if let Some(bracket_start) = track.find(" [") {
            let bracket = &track[bracket_start + 2..];
            track_name = track[..bracket_start].trim().to_string();
            if let Some(end) = bracket.find(']') {
                for token in bracket[..end].split(',') {
                    let token = token.trim();
                    if let Some(count) = token.strip_prefix("ahead ") {
                        ahead = count.trim().parse().unwrap_or(0);
                    } else if let Some(count) = token.strip_prefix("behind ") {
                        behind = count.trim().parse().unwrap_or(0);
                    }
                }
            }
        }
        if !track_name.is_empty() {
            upstream = Some(track_name);
        }
    }

    (branch, upstream, ahead, behind)
}

fn parse_status_file(line: &str) -> Option<GitFileStatus> {
    if line.len() < 4 {
        return None;
    }

    let index = line.chars().next()?.to_string();
    let worktree = line.chars().nth(1)?.to_string();
    let mut path = line[3..].trim().to_string();

    if path.contains(" -> ") {
        path = path.split(" -> ").nth(1)?.trim().to_string();
    }

    let untracked = index == "?" && worktree == "?";
    let staged = !untracked && index != " ";
    let unstaged = !untracked && worktree != " ";

    Some(GitFileStatus {
        path,
        index_status: index,
        worktree_status: worktree,
        staged,
        unstaged,
        untracked,
    })
}

pub fn git_status(cwd: &str) -> Result<GitStatusResult, String> {
    let repo = resolve_repo(cwd)?;
    let root = match repo_root(&repo) {
        Ok(root) => root,
        Err(_) => {
            return Ok(GitStatusResult {
                is_repo: false,
                repo_root: repo.to_string_lossy().into_owned(),
                branch: String::new(),
                upstream: None,
                ahead: 0,
                behind: 0,
                files: vec![],
            });
        }
    };

    let output = run_git(&root, &["status", "--porcelain=v1", "-b"])?;
    let mut branch = "HEAD".to_string();
    let mut upstream = None;
    let mut ahead = 0;
    let mut behind = 0;
    let mut files = Vec::new();

    for line in output.lines() {
        if line.starts_with("## ") {
            let parsed = parse_branch_line(line);
            branch = parsed.0;
            upstream = parsed.1;
            ahead = parsed.2;
            behind = parsed.3;
            continue;
        }
        if line.trim().is_empty() {
            continue;
        }
        if let Some(file) = parse_status_file(line) {
            files.push(file);
        }
    }

    Ok(GitStatusResult {
        is_repo: true,
        repo_root: root.to_string_lossy().into_owned(),
        branch,
        upstream,
        ahead,
        behind,
        files,
    })
}

pub fn git_diff(cwd: &str, path: &str, staged: bool) -> Result<String, String> {
    let repo = resolve_repo(cwd)?;
    let root = repo_root(&repo)?;
    let mut args = vec!["diff", "--no-color"];
    if staged {
        args.push("--cached");
    }
    if !path.is_empty() {
        args.push("--");
        args.push(path);
    }
    run_git(&root, &args)
}

pub fn git_stage(cwd: &str, paths: Vec<String>) -> Result<(), String> {
    let repo = resolve_repo(cwd)?;
    let root = repo_root(&repo)?;
    if paths.is_empty() {
        run_git(&root, &["add", "-A"]).map(|_| ())
    } else {
        let mut args = vec!["add", "--"];
        for path in &paths {
            args.push(path.as_str());
        }
        run_git(&root, &args).map(|_| ())
    }
}

pub fn git_unstage(cwd: &str, paths: Vec<String>) -> Result<(), String> {
    let repo = resolve_repo(cwd)?;
    let root = repo_root(&repo)?;
    if paths.is_empty() {
        return Ok(());
    }
    let mut args = vec!["restore", "--staged", "--"];
    for path in &paths {
        args.push(path.as_str());
    }
    run_git(&root, &args).map(|_| ())
}

pub fn git_discard(cwd: &str, path: &str) -> Result<(), String> {
    let repo = resolve_repo(cwd)?;
    let root = repo_root(&repo)?;
    run_git(&root, &["restore", "--", path]).map(|_| ())
}

pub fn git_commit(cwd: &str, message: &str) -> Result<(), String> {
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("Commit message is required".into());
    }
    let repo = resolve_repo(cwd)?;
    let root = repo_root(&repo)?;
    run_git(&root, &["commit", "-m", trimmed]).map(|_| ())
}

pub fn git_log(cwd: &str, limit: u32) -> Result<Vec<GitCommitEntry>, String> {
    let repo = resolve_repo(cwd)?;
    let root = repo_root(&repo)?;
    let limit_str = limit.max(1).to_string();
    let output = run_git(
        &root,
        &[
            "log",
            "-n",
            limit_str.as_str(),
            "--pretty=format:%h|%an|%ar|%s",
        ],
    )?;

    let commits = output
        .lines()
        .filter_map(|line| {
            let mut parts = line.splitn(4, '|');
            Some(GitCommitEntry {
                hash: parts.next()?.to_string(),
                author: parts.next()?.to_string(),
                relative_date: parts.next()?.to_string(),
                subject: parts.next()?.to_string(),
            })
        })
        .collect();

    Ok(commits)
}
