import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  FolderInput,
  FolderOpen,
  Loader2,
  MessageSquare,
  Pin,
  Trash2,
} from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { useSessionHistoryStore, useFilteredSessions } from "@/stores/sessionHistoryStore";
import { useUIStore } from "@/stores/uiStore";
import { switchToSession } from "@/lib/switch-session";
import { loadProject } from "@/lib/load-project";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import {
  groupSessionsIntoProjects,
  shortProjectPath,
} from "@/lib/project-utils";
import { pickProjectDirectory } from "@/lib/pick-project-dir";

export default function ProjectList() {
  const sessions = useFilteredSessions();
  const savedProjects = useUIStore((s) => s.projects);
  const removeProject = useUIStore((s) => s.removeProject);
  const sessionId = useAgentStore((s) => s.sessionId);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const renameSession = useSessionHistoryStore((s) => s.renameSession);
  const activeProjectCwd = getActiveProjectCwd();

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingProjectPath, setLoadingProjectPath] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const projects = useMemo(
    () => groupSessionsIntoProjects(sessions, savedProjects, activeProjectCwd),
    [sessions, savedProjects, activeProjectCwd],
  );

  useEffect(() => {
    if (activeProjectCwd) {
      setExpandedPaths((prev) => new Set(prev).add(activeProjectCwd));
    }
  }, [activeProjectCwd]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      renameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, renameSession]);

  const handleSelectSession = useCallback(async (id: string) => {
    if (loadingId || loadingProjectPath) return;
    const session = sessions.find((entry) => entry.id === id);
    if (!session || session.id === useAgentStore.getState().sessionId) return;
    setLoadingId(id);
    try {
      await switchToSession(session);
    } finally {
      setLoadingId(null);
    }
  }, [loadingId, loadingProjectPath, sessions]);

  const handleLoadProject = useCallback(async (path: string) => {
    if (loadingProjectPath || loadingId) return;
    setLoadingProjectPath(path);
    try {
      const loaded = await loadProject(path);
      if (loaded) {
        setExpandedPaths((prev) => new Set(prev).add(path));
      }
    } finally {
      setLoadingProjectPath(null);
    }
  }, [loadingId, loadingProjectPath]);

  const handleBrowseProject = useCallback(async () => {
    const selected = await pickProjectDirectory();
    if (!selected) return;
    await handleLoadProject(selected);
  }, [handleLoadProject]);

  const handleRemoveSavedProject = useCallback((path: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeProject(path);
  }, [removeProject]);

  return (
    <div className="sidebar-projects">
      <div className="sidebar-projects-toolbar">
        <button
          type="button"
          onClick={() => void handleBrowseProject()}
          disabled={isStreaming || !!loadingProjectPath}
          className="sidebar-btn-primary"
        >
          {loadingProjectPath ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <FolderInput size={13} />
          )}
          Open project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="sidebar-empty">
          <div className="sidebar-empty-icon">
            <FolderOpen size={18} strokeWidth={1.5} />
          </div>
          <p className="sidebar-empty-title">No projects yet</p>
          <p className="sidebar-empty-desc">
            Open a folder to work in context, or start a chat to create your first project entry.
          </p>
        </div>
      ) : (
        <div className="sidebar-project-cards">
          {projects.map((project) => {
            const expanded = expandedPaths.has(project.path);
            const isLoadingProject = loadingProjectPath === project.path;
            const sortedSessions = [...project.sessions].sort(
              (a, b) => b.lastActive - a.lastActive,
            );

            return (
              <article
                key={project.path}
                className={`sidebar-project-card${project.isActive ? " is-active" : ""}`}
              >
                <div className="sidebar-project-card-header">
                  <button
                    type="button"
                    onClick={() => toggleExpand(project.path)}
                    className="sidebar-project-card-toggle"
                    aria-expanded={expanded}
                    disabled={sortedSessions.length === 0}
                  >
                    <ChevronDown
                      size={14}
                      className={`sidebar-project-card-chevron${expanded ? " is-open" : ""}`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleLoadProject(project.path)}
                    disabled={isLoadingProject || isStreaming}
                    className="sidebar-project-card-main"
                    title={project.path}
                  >
                    <span className="sidebar-project-card-icon">
                      <FolderOpen size={15} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="sidebar-project-card-name">
                        {project.name}
                        {project.isActive && (
                          <span className="sidebar-project-card-badge">Active</span>
                        )}
                      </span>
                      <span className="sidebar-project-card-path">
                        {shortProjectPath(project.path)}
                      </span>
                    </span>
                  </button>

                  {project.isPinned && (
                    <button
                      type="button"
                      onClick={(event) => handleRemoveSavedProject(project.path, event)}
                      className="sidebar-project-card-action"
                      title="Remove from saved projects"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  {project.isPinned && !project.isActive && (
                    <Pin size={11} className="sidebar-project-card-pin" aria-hidden="true" />
                  )}
                </div>

                <div className="sidebar-project-card-meta">
                  <span>{sortedSessions.length} chat{sortedSessions.length === 1 ? "" : "s"}</span>
                  <span>·</span>
                  <span>
                    {project.lastActive > 0
                      ? formatDistanceToNow(project.lastActive, { addSuffix: true })
                      : "No activity"}
                  </span>
                </div>

                {expanded && sortedSessions.length > 0 && (
                  <div className="sidebar-project-sessions">
                    {sortedSessions.map((session) => {
                      const isActive = sessionId === session.id;
                      const isRenaming = renamingId === session.id;

                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => void handleSelectSession(session.id)}
                          disabled={
                            isRenaming
                            || (isStreaming && !isActive)
                            || loadingId === session.id
                            || isLoadingProject
                          }
                          className={`sidebar-project-session${isActive ? " is-active" : ""}`}
                        >
                          <MessageSquare size={12} className="sidebar-project-session-icon" />
                          {isRenaming ? (
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(event) => setRenameValue(event.target.value)}
                              onBlur={handleRenameSubmit}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") handleRenameSubmit();
                                if (event.key === "Escape") setRenamingId(null);
                              }}
                              className="sidebar-project-session-input"
                              onClick={(event) => event.stopPropagation()}
                            />
                          ) : (
                            <span
                              className="sidebar-project-session-name"
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                setRenamingId(session.id);
                                setRenameValue(session.name);
                              }}
                              title="Double-click to rename"
                            >
                              {session.name}
                            </span>
                          )}
                          <span className="sidebar-project-session-meta">
                            {loadingId === session.id
                              ? "…"
                              : formatDistanceToNow(session.lastActive, { addSuffix: false })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
