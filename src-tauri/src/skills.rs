use crate::file_ops::expand_tilde;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillSource {
    pub agent: String,
    pub scope: String,
    pub label: String,
    pub root: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRecord {
    pub id: String,
    pub name: String,
    pub description: String,
    pub skill_md_path: String,
    pub skill_dir: String,
    pub sources: Vec<SkillSource>,
    pub enabled: bool,
    pub internal: bool,
    pub symlink_target: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillsListResult {
    pub skills: Vec<SkillRecord>,
    pub total: usize,
    pub enabled: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillsCliResult {
    pub stdout: String,
    pub stderr: String,
    pub success: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
struct SkillsConfig {
    #[serde(default)]
    disabled: Vec<String>,
    #[serde(default)]
    show_internal: bool,
}

struct SkillRootSpec {
    agent: &'static str,
    scope: &'static str,
    label: &'static str,
    path: &'static str,
}

fn app_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
    Ok(PathBuf::from(home).join(".pi-gui"))
}

fn config_file() -> Result<PathBuf, String> {
    Ok(app_dir()?.join("skills-config.json"))
}

fn ensure_app_dir() -> Result<(), String> {
    let dir = app_dir()?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create {}: {e}", dir.display()))
}

fn read_config() -> Result<SkillsConfig, String> {
    ensure_app_dir()?;
    let path = config_file()?;
    if !path.exists() {
        return Ok(SkillsConfig::default());
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Failed to read skills config: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Failed to parse skills config: {e}"))
}

fn write_config(config: &SkillsConfig) -> Result<(), String> {
    ensure_app_dir()?;
    let path = config_file()?;
    let raw = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize skills config: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("Failed to write skills config: {e}"))
}

fn skill_roots(project_cwd: Option<&str>) -> Vec<(PathBuf, SkillRootSpec)> {
    let mut roots = Vec::new();

    let global_specs = [
        SkillRootSpec {
            agent: "pi",
            scope: "global",
            label: "Pi (global)",
            path: "~/.pi/agent/skills",
        },
        SkillRootSpec {
            agent: "cursor",
            scope: "global",
            label: "Cursor (global)",
            path: "~/.cursor/skills",
        },
        SkillRootSpec {
            agent: "cursor",
            scope: "global",
            label: "Cursor (built-in)",
            path: "~/.cursor/skills-cursor",
        },
        SkillRootSpec {
            agent: "agents",
            scope: "global",
            label: "Shared agents (global)",
            path: "~/.agents/skills",
        },
        SkillRootSpec {
            agent: "codex",
            scope: "global",
            label: "Codex (global)",
            path: "~/.codex/skills",
        },
    ];

    for spec in global_specs {
        roots.push((expand_tilde(spec.path), spec));
    }

    if let Some(cwd) = project_cwd.filter(|value| !value.trim().is_empty()) {
        let project = expand_tilde(cwd);
        let project_specs = [
            SkillRootSpec {
                agent: "pi",
                scope: "project",
                label: "Pi (project)",
                path: ".pi/skills",
            },
            SkillRootSpec {
                agent: "cursor",
                scope: "project",
                label: "Cursor (project)",
                path: ".agents/skills",
            },
            SkillRootSpec {
                agent: "cursor",
                scope: "project",
                label: "Cursor alt (project)",
                path: ".cursor/skills",
            },
        ];

        for spec in project_specs {
            roots.push((project.join(spec.path.trim_start_matches("./")), spec));
        }
    }

    roots
}

fn canonical_key(path: &Path) -> String {
    path.canonicalize()
        .unwrap_or_else(|_| path.to_path_buf())
        .to_string_lossy()
        .to_string()
}

fn parse_yaml_scalar(raw: &str) -> String {
    let trimmed = raw.trim();
    if (trimmed.starts_with('"') && trimmed.ends_with('"'))
        || (trimmed.starts_with('\'') && trimmed.ends_with('\''))
    {
        return trimmed[1..trimmed.len() - 1].trim().to_string();
    }
    trimmed.to_string()
}

fn parse_frontmatter(content: &str) -> (Option<String>, Option<String>, bool) {
    let Some(body) = content.strip_prefix("---") else {
        return (None, None, false);
    };
    let Some(body) = body.strip_prefix('\n').or_else(|| body.strip_prefix("\r\n")) else {
        return (None, None, false);
    };
    let Some(end) = body.find("\n---") else {
        return (None, None, false);
    };
    let yaml = &body[..end];

    let mut name = None;
    let mut description = None;
    let mut internal = false;
    let mut in_description = false;
    let mut desc_lines: Vec<String> = Vec::new();

    for line in yaml.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("metadata:") {
            continue;
        }
        if trimmed.contains("internal:") && trimmed.contains("true") {
            internal = true;
        }

        if in_description {
            if line.starts_with(' ') || line.starts_with('\t') {
                desc_lines.push(trimmed.to_string());
                continue;
            }
            if !desc_lines.is_empty() {
                description = Some(desc_lines.join(" "));
                desc_lines.clear();
            }
            in_description = false;
        }

        if let Some(value) = trimmed.strip_prefix("name:") {
            name = Some(parse_yaml_scalar(value));
            continue;
        }

        if let Some(value) = trimmed.strip_prefix("description:") {
            let inline = value.trim();
            if inline.is_empty() || inline == ">- " || inline == ">- " || inline == ">-"
                || inline == ">" || inline == "|"
            {
                in_description = true;
            } else {
                description = Some(parse_yaml_scalar(inline));
            }
        }
    }

    if description.is_none() && !desc_lines.is_empty() {
        description = Some(desc_lines.join(" "));
    }

    (name, description, internal)
}

fn read_skill_metadata(skill_md: &Path) -> (String, String, bool) {
    let content = fs::read_to_string(skill_md).unwrap_or_default();
    let (name, description, internal) = parse_frontmatter(&content);
    let folder_name = skill_md
        .parent()
        .and_then(|p| p.file_name())
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    (
        name.unwrap_or(folder_name.clone()),
        description.unwrap_or_else(|| "No description".to_string()),
        internal,
    )
}

fn symlink_target(path: &Path) -> Option<String> {
    fs::read_link(path)
        .ok()
        .map(|target| target.to_string_lossy().to_string())
}

fn collect_skills_in_root(root: &Path, spec: &SkillRootSpec) -> Vec<(PathBuf, SkillSource)> {
    if !root.is_dir() {
        return vec![];
    }

    let source = SkillSource {
        agent: spec.agent.to_string(),
        scope: spec.scope.to_string(),
        label: spec.label.to_string(),
        root: root.to_string_lossy().to_string(),
    };

    let mut found = Vec::new();

    if root.join("SKILL.md").is_file() {
        found.push((root.to_path_buf(), source));
        return found;
    }

    let entries = match fs::read_dir(root) {
        Ok(entries) => entries,
        Err(_) => return found,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name == "node_modules" || name == ".git" {
            continue;
        }
        if path.join("SKILL.md").is_file() {
            found.push((path, source.clone()));
            continue;
        }

        // One nested level (e.g. codex/.system/pdf)
        if name.starts_with('.') {
            if let Ok(nested) = fs::read_dir(&path) {
                for nested_entry in nested.flatten() {
                    let nested_path = nested_entry.path();
                    if nested_path.is_dir() && nested_path.join("SKILL.md").is_file() {
                        found.push((nested_path, source.clone()));
                    }
                }
            }
        }
    }

    found
}

pub fn list_installed_skills(
    project_cwd: Option<String>,
    include_internal: bool,
) -> Result<SkillsListResult, String> {
    let config = read_config()?;
    let show_internal = include_internal || config.show_internal;
    let disabled: HashSet<String> = config.disabled.into_iter().collect();

    let mut merged: HashMap<String, SkillRecord> = HashMap::new();

    for (root, spec) in skill_roots(project_cwd.as_deref()) {
        for (skill_dir, source) in collect_skills_in_root(&root, &spec) {
            let skill_md = skill_dir.join("SKILL.md");
            let key = canonical_key(&skill_dir);
            let (name, description, internal) = read_skill_metadata(&skill_md);

            if internal && !show_internal {
                continue;
            }

            let id = name
                .to_lowercase()
                .replace(' ', "-")
                .chars()
                .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
                .collect::<String>();

            let enabled = !disabled.contains(&key);
            let symlink_target = symlink_target(&skill_dir);

            if let Some(existing) = merged.get_mut(&key) {
                if !existing.sources.iter().any(|s| s.label == source.label) {
                    existing.sources.push(source);
                }
            } else {
                merged.insert(
                    key,
                    SkillRecord {
                        id,
                        name,
                        description,
                        skill_md_path: skill_md.to_string_lossy().to_string(),
                        skill_dir: skill_dir.to_string_lossy().to_string(),
                        sources: vec![source],
                        enabled,
                        internal,
                        symlink_target,
                    },
                );
            }
        }
    }

    let mut skills: Vec<SkillRecord> = merged.into_values().collect();
    skills.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    let enabled = skills.iter().filter(|skill| skill.enabled).count();

    Ok(SkillsListResult {
        total: skills.len(),
        enabled,
        skills,
    })
}

pub fn set_skill_enabled(skill_dir: String, enabled: bool) -> Result<(), String> {
    let key = canonical_key(&PathBuf::from(&skill_dir));
    let mut config = read_config()?;
    config.disabled.retain(|entry| entry != &key);

    if !enabled {
        config.disabled.push(key);
    }

    write_config(&config)
}

pub fn read_skill_content(skill_md_path: String) -> Result<String, String> {
    let path = expand_tilde(&skill_md_path);
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {e}", path.display()))
}

pub fn write_skill_content(skill_md_path: String, content: String) -> Result<(), String> {
    let path = expand_tilde(&skill_md_path);
    if !path.exists() {
        return Err(format!("Skill file not found: {}", path.display()));
    }
    fs::write(&path, content).map_err(|e| format!("Failed to write {}: {e}", path.display()))
}

fn resolve_npx() -> Result<String, String> {
    which::which("npx")
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(|_| "Could not find `npx` on PATH. Install Node.js.".to_string())
}

fn run_skills_cli(args: &[String], cwd: Option<&Path>) -> Result<SkillsCliResult, String> {
    let npx = resolve_npx()?;
    let mut command = Command::new(npx);
    command
        .arg("--yes")
        .arg("skills");
    for arg in args {
        command.arg(arg);
    }
    command.stdout(Stdio::piped()).stderr(Stdio::piped());

    if let Some(cwd) = cwd {
        command.current_dir(cwd);
    }

    let output = command
        .output()
        .map_err(|e| format!("Failed to run skills CLI: {e}"))?;

    Ok(SkillsCliResult {
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        success: output.status.success(),
    })
}

pub fn skills_cli_add(
    source: String,
    project_cwd: Option<String>,
    global: bool,
    agent: String,
    skills: Option<Vec<String>>,
    copy: bool,
) -> Result<SkillsCliResult, String> {
    let mut args = vec![
        "add".to_string(),
        source,
        "-a".to_string(),
        agent,
        "-y".to_string(),
    ];
    if global {
        args.push("-g".to_string());
    }
    if copy {
        args.push("--copy".to_string());
    }
    if let Some(skill_names) = skills {
        for name in skill_names {
            args.push("-s".to_string());
            args.push(name);
        }
    }

    let cwd = project_cwd.map(|value| expand_tilde(&value));
    run_skills_cli(&args, cwd.as_deref())
}

pub fn skills_cli_list(
    project_cwd: Option<String>,
    global: bool,
    agent: Option<String>,
) -> Result<SkillsCliResult, String> {
    let mut args = vec!["ls".to_string()];
    if global {
        args.push("-g".to_string());
    }
    if let Some(agent_name) = agent {
        args.push("-a".to_string());
        args.push(agent_name);
    }

    let cwd = project_cwd.map(|value| expand_tilde(&value));
    run_skills_cli(&args, cwd.as_deref())
}

pub fn skills_cli_list_remote(source: String) -> Result<SkillsCliResult, String> {
    run_skills_cli(
        &[
            "add".to_string(),
            source,
            "--list".to_string(),
            "-y".to_string(),
        ],
        None,
    )
}

pub fn skills_cli_find(query: Option<String>) -> Result<SkillsCliResult, String> {
    let mut args = vec!["find".to_string()];
    if let Some(value) = query.filter(|entry| !entry.trim().is_empty()) {
        args.push(value);
    }
    run_skills_cli(&args, None)
}

pub fn skills_cli_remove(
    skill_names: Vec<String>,
    project_cwd: Option<String>,
    global: bool,
    agent: Option<String>,
) -> Result<SkillsCliResult, String> {
    let mut args = vec!["remove".to_string(), "-y".to_string()];
    if global {
        args.push("-g".to_string());
    }
    if let Some(agent_name) = agent {
        args.push("-a".to_string());
        args.push(agent_name);
    }
    args.extend(skill_names);

    let cwd = project_cwd.map(|value| expand_tilde(&value));
    run_skills_cli(&args, cwd.as_deref())
}

pub fn skills_cli_update(
    project_cwd: Option<String>,
    global: bool,
    skill_names: Option<Vec<String>>,
) -> Result<SkillsCliResult, String> {
    let mut args = vec!["update".to_string(), "-y".to_string()];
    if global {
        args.push("-g".to_string());
    }
    if let Some(names) = skill_names {
        args.extend(names);
    }

    let cwd = project_cwd.map(|value| expand_tilde(&value));
    run_skills_cli(&args, cwd.as_deref())
}

pub fn skills_cli_init(name: Option<String>, project_cwd: Option<String>) -> Result<SkillsCliResult, String> {
    let mut args = vec!["init".to_string()];
    if let Some(skill_name) = name {
        args.push(skill_name);
    }

    let cwd = project_cwd.map(|value| expand_tilde(&value));
    run_skills_cli(&args, cwd.as_deref())
}
