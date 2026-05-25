import type { SessionRecord } from "@/stores/sessionHistoryStore";
import type { Project } from "@/stores/uiStore";
import { isSameProjectPath } from "@/lib/project-cwd";

export interface ProjectGroup {
  path: string;
  name: string;
  sessions: {
    id: string;
    name: string;
    lastActive: number;
    messageCount: number;
  }[];
  lastActive: number;
  isPinned: boolean;
  isActive: boolean;
}

function projectNameFromPath(path: string): string {
  return path.split("/").filter(Boolean).pop() || path;
}

export function groupSessionsIntoProjects(
  sessions: SessionRecord[],
  savedProjects: Project[],
  activeProjectCwd: string,
): ProjectGroup[] {
  const byPath = new Map<string, ProjectGroup>();

  for (const project of savedProjects) {
    byPath.set(project.path, {
      path: project.path,
      name: project.name || projectNameFromPath(project.path),
      sessions: [],
      lastActive: Date.parse(project.lastActive) || 0,
      isPinned: true,
      isActive: isSameProjectPath(project.path, activeProjectCwd),
    });
  }

  for (const session of sessions) {
    const path = session.cwd?.trim() || "Unknown project";
    const name = projectNameFromPath(path);
    const entry = {
      id: session.id,
      name: session.name,
      lastActive: session.updatedAt,
      messageCount: session.messages.length,
    };

    const existing = byPath.get(path);
    if (existing) {
      existing.sessions.push(entry);
      existing.lastActive = Math.max(existing.lastActive, session.updatedAt);
      existing.isActive = existing.isActive || isSameProjectPath(path, activeProjectCwd);
    } else {
      byPath.set(path, {
        path,
        name,
        sessions: [entry],
        lastActive: session.updatedAt,
        isPinned: false,
        isActive: isSameProjectPath(path, activeProjectCwd),
      });
    }
  }

  return [...byPath.values()].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return b.lastActive - a.lastActive;
  });
}

export function shortProjectPath(fullPath: string): string {
  const parts = fullPath.replace(/\/$/, "").split("/");
  if (parts.length <= 2) return fullPath;
  return `…/${parts.slice(-2).join("/")}`;
}
