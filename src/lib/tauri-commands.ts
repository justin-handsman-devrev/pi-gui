// ── Safe Tauri invoke wrapper ────────────────────────────────────────────────
// When running in a plain browser (e.g. vite dev for UI preview),
// @tauri-apps/api/core.invoke is undefined because there's no Tauri runtime.
// We wrap it to give a clear console error instead of crashing the UI.

let _invoke: typeof import("@tauri-apps/api/core").invoke | undefined;

try {
  _invoke = await import("@tauri-apps/api/core").then((m) => m.invoke);
} catch {
  // not in Tauri — _invoke stays undefined
}

function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!_invoke) {
    console.warn(
      `[tauri] invoke("${cmd}") called outside Tauri runtime — command ignored. ` +
      `Run inside "cargo tauri dev" for full functionality.`
    );
    return new Promise(() => {}); // never resolves — prevents crash
  }
  return _invoke(cmd, args);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ModelInfo {
  provider: string;
  id: string;
  contextWindow: number;
  reasoning: boolean;
}

export interface RpcSessionState {
  model?: { provider: string; id: string };
  thinkingLevel: string;
  isStreaming: boolean;
  isCompacting: boolean;
  sessionId: string;
  sessionName?: string;
  sessionFile?: string;
}

export interface RpcSessionStats {
  tokens: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
    total: number;
  };
  cost: number;
  contextUsage?: {
    tokens: number | null;
    contextWindow: number;
    percent: number | null;
  };
}

export interface CompactionResult {
  success: boolean;
  message?: string;
  tokensSaved?: number;
}

// ── Command wrappers ─────────────────────────────────────────────────────────

export const startAgent = (cwd: string): Promise<void> =>
  safeInvoke("start_agent", { cwd });

export interface RpcImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

export const sendPrompt = (
  message: string,
  images?: RpcImageContent[],
): Promise<void> =>
  safeInvoke("send_prompt", { message, images: images ?? null });

export const steer = (
  message: string,
  images?: RpcImageContent[],
): Promise<void> =>
  safeInvoke("steer", { message, images: images ?? null });

export const abortAgent = (): Promise<void> =>
  safeInvoke("abort_agent");

export const newSession = (): Promise<{ cancelled: boolean }> =>
  safeInvoke("new_session");

export const getState = (): Promise<RpcSessionState> =>
  safeInvoke("get_state");

export const getSessionStats = (): Promise<RpcSessionStats> =>
  safeInvoke("get_session_stats");

export const setModel = (
  provider: string,
  modelId: string,
): Promise<{ provider: string; id: string }> =>
  safeInvoke("set_model", { provider, modelId });

export const getAvailableModels = (): Promise<{ models: ModelInfo[] }> =>
  safeInvoke("get_available_models");

export const setThinkingLevel = (level: string): Promise<void> =>
  safeInvoke("set_thinking_level", { level });

export const compactSession = (): Promise<CompactionResult> =>
  safeInvoke("compact_session");

export const switchSession = (sessionPath: string): Promise<{ cancelled?: boolean }> =>
  safeInvoke("switch_session", { sessionPath });

export const getMessages = (): Promise<unknown> =>
  safeInvoke("get_messages");

export interface PiSlashCommandSourceInfo {
  path?: string;
  source?: string;
  scope?: "user" | "project" | "temporary";
  origin?: string;
  baseDir?: string;
}

export interface PiSlashCommand {
  name: string;
  description?: string;
  source: "extension" | "prompt" | "skill";
  location?: "user" | "project" | "path";
  path?: string;
  sourceInfo?: PiSlashCommandSourceInfo;
}

export interface PiCommandsResult {
  commands: PiSlashCommand[];
}

export const getCommands = (): Promise<PiCommandsResult> =>
  safeInvoke("get_commands");

export const resolveSessionPath = (
  sessionArg: string,
  cwdHint?: string,
): Promise<string> =>
  safeInvoke("resolve_session_path", {
    sessionArg,
    cwdHint: cwdHint || null,
  });

export interface DirEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export const listDirectory = (path: string): Promise<DirEntry[]> =>
  safeInvoke("list_directory", { path }).then((entries: unknown) =>
    (entries as Array<{ name: string; path: string; is_directory: boolean }>).map(
      (entry) => ({
        name: entry.name,
        path: entry.path,
        isDirectory: entry.is_directory,
      }),
    ),
  );

export const readTextFile = (path: string): Promise<string> =>
  safeInvoke("read_text_file", { path });

export const writeTextFile = (path: string, content: string): Promise<void> =>
  safeInvoke("write_text_file", { path, content });

export interface ScheduledJobRecord {
  id: string;
  name: string;
  prompt: string;
  cwd: string;
  schedule: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export const listScheduledJobs = (): Promise<ScheduledJobRecord[]> =>
  safeInvoke("list_scheduled_jobs");

export const upsertScheduledJob = (
  job: ScheduledJobRecord,
): Promise<ScheduledJobRecord> =>
  safeInvoke("upsert_scheduled_job", { job });

export const deleteScheduledJob = (id: string): Promise<void> =>
  safeInvoke("delete_scheduled_job", { id });

export const setScheduledJobEnabled = (
  id: string,
  enabled: boolean,
): Promise<ScheduledJobRecord> =>
  safeInvoke("set_scheduled_job_enabled", { id, enabled });

export interface GitFileStatus {
  path: string;
  indexStatus: string;
  worktreeStatus: string;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
}

export interface GitStatusResult {
  isRepo: boolean;
  repoRoot: string;
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  files: GitFileStatus[];
}

export interface GitCommitEntry {
  hash: string;
  subject: string;
  author: string;
  relativeDate: string;
}

export const gitStatus = (cwd: string): Promise<GitStatusResult> =>
  safeInvoke("git_status", { cwd });

export const gitDiff = (
  cwd: string,
  path: string,
  staged: boolean,
): Promise<string> =>
  safeInvoke("git_diff", { cwd, path, staged });

export const gitStage = (cwd: string, paths: string[]): Promise<void> =>
  safeInvoke("git_stage", { cwd, paths });

export const gitUnstage = (cwd: string, paths: string[]): Promise<void> =>
  safeInvoke("git_unstage", { cwd, paths });

export const gitDiscard = (cwd: string, path: string): Promise<void> =>
  safeInvoke("git_discard", { cwd, path });

export const gitCommit = (cwd: string, message: string): Promise<void> =>
  safeInvoke("git_commit", { cwd, message });

export const gitLog = (cwd: string, limit = 12): Promise<GitCommitEntry[]> =>
  safeInvoke("git_log", { cwd, limit });

export interface SkillSource {
  agent: string;
  scope: string;
  label: string;
  root: string;
}

export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  skillMdPath: string;
  skillDir: string;
  sources: SkillSource[];
  enabled: boolean;
  internal: boolean;
  symlinkTarget: string | null;
}

export interface SkillsListResult {
  skills: SkillRecord[];
  total: number;
  enabled: number;
}

export interface SkillsCliResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

export const listInstalledSkills = (
  projectCwd?: string,
  includeInternal = false,
): Promise<SkillsListResult> =>
  safeInvoke("list_installed_skills", {
    projectCwd: projectCwd ?? null,
    includeInternal,
  });

export const setSkillEnabled = (skillDir: string, enabled: boolean): Promise<void> =>
  safeInvoke("set_skill_enabled", { skillDir, enabled });

export const readSkillContent = (skillMdPath: string): Promise<string> =>
  safeInvoke("read_skill_content", { skillMdPath });

export const writeSkillContent = (skillMdPath: string, content: string): Promise<void> =>
  safeInvoke("write_skill_content", { skillMdPath, content });

export const skillsCliAdd = (options: {
  source: string;
  projectCwd?: string;
  global?: boolean;
  agent?: string;
  skills?: string[];
  copy?: boolean;
}): Promise<SkillsCliResult> =>
  safeInvoke("skills_cli_add", {
    source: options.source,
    projectCwd: options.projectCwd ?? null,
    global: options.global ?? false,
    agent: options.agent ?? "pi",
    skills: options.skills ?? null,
    copy: options.copy ?? false,
  });

export const skillsCliListRemote = (source: string): Promise<SkillsCliResult> =>
  safeInvoke("skills_cli_list_remote", { source });

export const skillsCliFind = (query?: string): Promise<SkillsCliResult> =>
  safeInvoke("skills_cli_find", { query: query ?? null });

export const skillsCliRemove = (options: {
  skillNames: string[];
  projectCwd?: string;
  global?: boolean;
  agent?: string;
}): Promise<SkillsCliResult> =>
  safeInvoke("skills_cli_remove", {
    skillNames: options.skillNames,
    projectCwd: options.projectCwd ?? null,
    global: options.global ?? false,
    agent: options.agent ?? null,
  });

export const skillsCliUpdate = (options: {
  projectCwd?: string;
  global?: boolean;
  skillNames?: string[];
}): Promise<SkillsCliResult> =>
  safeInvoke("skills_cli_update", {
    projectCwd: options.projectCwd ?? null,
    global: options.global ?? false,
    skillNames: options.skillNames ?? null,
  });

export const skillsCliInit = (options: {
  name?: string;
  projectCwd?: string;
}): Promise<SkillsCliResult> =>
  safeInvoke("skills_cli_init", {
    name: options.name ?? null,
    projectCwd: options.projectCwd ?? null,
  });
