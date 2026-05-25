import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useCanvasStore } from "@/canvas/canvasStore";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import {
  gitCommit,
  gitDiff,
  gitDiscard,
  gitLog,
  gitStage,
  gitStatus,
  gitUnstage,
  readTextFile,
  type GitCommitEntry,
  type GitFileStatus,
  type GitStatusResult,
} from "@/lib/tauri-commands";
import { parseUnifiedDiff } from "@/lib/diff-parser";
import DiffRenderer from "@/canvas/DiffRenderer";
import type { DiffInfo } from "@/canvas/canvasStore";

function statusLabel(file: GitFileStatus): string {
  if (file.untracked) return "Untracked";
  if (file.staged && file.unstaged) return "Modified";
  if (file.staged) return "Staged";
  if (file.indexStatus === "A") return "Added";
  if (file.indexStatus === "D" || file.worktreeStatus === "D") return "Deleted";
  return "Modified";
}

function joinRepoPath(repoRoot: string, relativePath: string): string {
  if (relativePath.startsWith("/")) return relativePath;
  return `${repoRoot.replace(/\/$/, "")}/${relativePath}`;
}

export default function CanvasGitPanel() {
  const setPanelMode = useCanvasStore((s) => s.setPanelMode);
  const openFile = useCanvasStore((s) => s.openFile);
  const projectCwd = getActiveProjectCwd();

  const [status, setStatus] = useState<GitStatusResult | null>(null);
  const [commits, setCommits] = useState<GitCommitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedStaged, setSelectedStaged] = useState(false);
  const [diffText, setDiffText] = useState("");
  const [commitMessage, setCommitMessage] = useState("");

  const refresh = useCallback(async () => {
    if (!projectCwd) return;
    setLoading(true);
    setError(null);
    try {
      const [nextStatus, nextLog] = await Promise.all([
        gitStatus(projectCwd),
        gitLog(projectCwd, 8),
      ]);
      setStatus(nextStatus);
      setCommits(nextLog);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [projectCwd]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadDiff = useCallback(async (path: string, staged: boolean) => {
    if (!projectCwd) return;
    setSelectedPath(path);
    setSelectedStaged(staged);
    try {
      const diff = await gitDiff(projectCwd, path, staged);
      setDiffText(diff);
    } catch (err: unknown) {
      setDiffText("");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [projectCwd]);

  const stagedFiles = useMemo(
    () => status?.files.filter((file) => file.staged) ?? [],
    [status],
  );
  const unstagedFiles = useMemo(
    () => status?.files.filter((file) => file.unstaged && !file.untracked) ?? [],
    [status],
  );
  const untrackedFiles = useMemo(
    () => status?.files.filter((file) => file.untracked) ?? [],
    [status],
  );

  const runGitAction = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
      if (selectedPath) {
        await loadDiff(selectedPath, selectedStaged);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [loadDiff, refresh, selectedPath, selectedStaged]);

  const handleStage = (path: string) => {
    void runGitAction(() => gitStage(projectCwd, [path]));
  };

  const handleUnstage = (path: string) => {
    void runGitAction(() => gitUnstage(projectCwd, [path]));
  };

  const handleStageAll = () => {
    void runGitAction(() => gitStage(projectCwd, []));
  };

  const handleDiscard = (path: string) => {
    void runGitAction(() => gitDiscard(projectCwd, path));
  };

  const handleCommit = () => {
    void runGitAction(async () => {
      await gitCommit(projectCwd, commitMessage);
      setCommitMessage("");
    });
  };

  const handleOpenFile = async (path: string) => {
    if (!status?.repoRoot) return;
    const absolutePath = joinRepoPath(status.repoRoot, path);
    try {
      const content = await readTextFile(absolutePath);
      openFile(absolutePath, content);
      setPanelMode("files");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const diffInfo: DiffInfo[] = useMemo(() => {
    if (!diffText.trim() || !selectedPath) return [];
    return [{
      toolCallId: "git",
      diff: diffText,
      parsedLines: parseUnifiedDiff(diffText),
    }];
  }, [diffText, selectedPath]);

  if (!projectCwd) {
    return (
      <div className="canvas-git-empty">
        <p>Open a project to use Git.</p>
      </div>
    );
  }

  if (loading && !status) {
    return (
      <div className="canvas-git-empty">
        <Loader2 size={18} className="animate-spin" style={{ color: "var(--muted-soft)" }} />
      </div>
    );
  }

  if (status && !status.isRepo) {
    return (
      <div className="canvas-git-empty">
        <GitBranch size={20} style={{ color: "var(--muted-soft)" }} />
        <p>Not a git repository</p>
        <p className="canvas-git-empty-desc">Initialize git in this project to track changes here.</p>
      </div>
    );
  }

  return (
    <div className="canvas-git">
      <aside className="canvas-git-sidebar">
        <div className="canvas-git-sidebar-header">
          <div className="canvas-git-branch">
            <GitBranch size={14} />
            <span className="canvas-git-branch-name">{status?.branch}</span>
          </div>
          {status?.upstream && (
            <span className="canvas-git-upstream">{status.upstream}</span>
          )}
          <div className="canvas-git-sync">
            {(status?.ahead ?? 0) > 0 && (
              <span className="canvas-git-sync-pill">
                <ArrowUp size={10} />
                {status?.ahead}
              </span>
            )}
            {(status?.behind ?? 0) > 0 && (
              <span className="canvas-git-sync-pill">
                <ArrowDown size={10} />
                {status?.behind}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="canvas-header-btn"
            title="Refresh git status"
            disabled={busy}
          >
            <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
          </button>
        </div>

        {error && <div className="canvas-git-error">{error}</div>}

        <div className="canvas-git-sections">
          <GitFileGroup
            title="Staged"
            files={stagedFiles}
            selectedPath={selectedPath}
            onSelect={(path) => void loadDiff(path, true)}
            onStage={handleStage}
            onUnstage={handleUnstage}
            onDiscard={handleDiscard}
            onOpen={handleOpenFile}
            showUnstage
          />
          <GitFileGroup
            title="Changes"
            files={unstagedFiles}
            selectedPath={selectedPath}
            onSelect={(path) => void loadDiff(path, false)}
            onStage={handleStage}
            onUnstage={handleUnstage}
            onDiscard={handleDiscard}
            onOpen={handleOpenFile}
            showStage
            showDiscard
          />
          <GitFileGroup
            title="Untracked"
            files={untrackedFiles}
            selectedPath={selectedPath}
            onSelect={(path) => void loadDiff(path, false)}
            onStage={handleStage}
            onUnstage={handleUnstage}
            onDiscard={handleDiscard}
            onOpen={handleOpenFile}
            showStage
          />
        </div>

        <div className="canvas-git-commit">
          <textarea
            value={commitMessage}
            onChange={(event) => setCommitMessage(event.target.value)}
            placeholder="Commit message"
            rows={3}
            className="canvas-git-commit-input"
          />
          <div className="canvas-git-commit-actions">
            <button
              type="button"
              onClick={handleStageAll}
              disabled={busy || (status?.files.length ?? 0) === 0}
              className="canvas-git-btn-secondary"
            >
              Stage all
            </button>
            <button
              type="button"
              onClick={handleCommit}
              disabled={busy || !commitMessage.trim() || stagedFiles.length === 0}
              className="canvas-git-btn-primary"
            >
              Commit
            </button>
          </div>
        </div>

        {commits.length > 0 && (
          <div className="canvas-git-log">
            <p className="canvas-git-log-title">Recent commits</p>
            {commits.map((commit) => (
              <div key={commit.hash} className="canvas-git-log-item">
                <span className="canvas-git-log-hash">{commit.hash}</span>
                <span className="canvas-git-log-subject">{commit.subject}</span>
                <span className="canvas-git-log-meta">
                  {commit.relativeDate} · {commit.author}
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>

      <div className="canvas-git-main">
        {selectedPath && diffInfo.length > 0 ? (
          <DiffRenderer
            diffs={diffInfo}
            filePath={joinRepoPath(status?.repoRoot ?? projectCwd, selectedPath)}
          />
        ) : (
          <div className="canvas-git-empty">
            <p>Select a changed file to view its diff.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface GitFileGroupProps {
  title: string;
  files: GitFileStatus[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onDiscard: (path: string) => void;
  onOpen: (path: string) => void;
  showStage?: boolean;
  showUnstage?: boolean;
  showDiscard?: boolean;
}

function GitFileGroup({
  title,
  files,
  selectedPath,
  onSelect,
  onStage,
  onUnstage,
  onDiscard,
  onOpen,
  showStage = false,
  showUnstage = false,
  showDiscard = false,
}: GitFileGroupProps) {
  if (files.length === 0) return null;

  return (
    <section className="canvas-git-group">
      <header className="canvas-git-group-header">
        <span>{title}</span>
        <span className="canvas-git-group-count">{files.length}</span>
      </header>
      <ul className="canvas-git-file-list">
        {files.map((file) => {
          const active = selectedPath === file.path;
          return (
            <li key={file.path} className={`canvas-git-file${active ? " is-active" : ""}`}>
              <button
                type="button"
                className="canvas-git-file-main"
                onClick={() => onSelect(file.path)}
                title={file.path}
              >
                <span className="canvas-git-file-status">{statusLabel(file)}</span>
                <span className="canvas-git-file-path">{file.path}</span>
              </button>
              <div className="canvas-git-file-actions">
                {showStage && (
                  <button type="button" className="canvas-git-icon-btn" title="Stage" onClick={() => onStage(file.path)}>
                    <Plus size={11} />
                  </button>
                )}
                {showUnstage && (
                  <button type="button" className="canvas-git-icon-btn" title="Unstage" onClick={() => onUnstage(file.path)}>
                    <Minus size={11} />
                  </button>
                )}
                {showDiscard && (
                  <button type="button" className="canvas-git-icon-btn" title="Discard changes" onClick={() => onDiscard(file.path)}>
                    <RotateCcw size={11} />
                  </button>
                )}
                <button type="button" className="canvas-git-icon-btn" title="Open file" onClick={() => void onOpen(file.path)}>
                  Open
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
