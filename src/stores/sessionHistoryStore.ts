import { create } from "zustand";
import { useMemo } from "react";
import type { ToolCallInfo } from "@/stores/agentStore";
import { useAgentStore } from "@/stores/agentStore";
import { isGenericSessionTitle, resolveSessionName } from "@/lib/session-title";

export interface SessionMessageRecord {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  thinking?: string | null;
  preamble?: string;
  toolCalls?: ToolCallInfo[];
}

export interface SessionRecord {
  id: string;
  name: string;
  cwd: string;
  messages: SessionMessageRecord[];
  model?: { provider: string; id: string };
  sessionFile?: string;
  /** When true, auto-title generation will not overwrite the name. */
  titleLocked?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SessionHistoryState {
  sessions: SessionRecord[];
  searchQuery: string;

  loadSessions: () => void;
  saveSession: (session: SessionRecord) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  setSearchQuery: (q: string) => void;
}

const STORAGE_KEY = "pi-gui-session-history";

function backfillSessionTitles(sessions: SessionRecord[]): SessionRecord[] {
  let changed = false;
  const updated = sessions.map((session) => {
    if (session.titleLocked || !isGenericSessionTitle(session.name)) {
      return session;
    }
    const name = resolveSessionName({
      existingName: session.name,
      titleLocked: false,
      messages: session.messages,
    });
    if (name === session.name) return session;
    changed = true;
    return { ...session, name };
  });
  if (changed) writeToStorage(updated);
  return updated;
}

function readFromStorage(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const sessions: SessionRecord[] = raw ? JSON.parse(raw) : [];
    return backfillSessionTitles(sessions);
  } catch {
    return [];
  }
}

function writeToStorage(sessions: SessionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function filterSessions(
  sessions: SessionRecord[],
  searchQuery: string,
): SessionRecord[] {
  if (!searchQuery.trim()) return sessions;
  const lower = searchQuery.toLowerCase();
  return sessions.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.cwd.toLowerCase().includes(lower) ||
      s.messages.some((m) => m.content.toLowerCase().includes(lower)),
  );
}

export const useSessionHistoryStore = create<SessionHistoryState>((set) => ({
  sessions: readFromStorage(),
  searchQuery: "",

  loadSessions: () => set({ sessions: readFromStorage() }),

  saveSession: (session) =>
    set((s) => {
      const sessions = [
        ...s.sessions.filter((ses) => ses.id !== session.id),
        session,
      ].sort((a, b) => b.updatedAt - a.updatedAt);
      writeToStorage(sessions);
      return { sessions };
    }),

  deleteSession: (id) =>
    set((s) => {
      const sessions = s.sessions.filter((ses) => ses.id !== id);
      writeToStorage(sessions);
      return { sessions };
    }),

  renameSession: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    set((s) => {
      const sessions = s.sessions.map((ses) =>
        ses.id === id
          ? { ...ses, name: trimmed, titleLocked: true, updatedAt: Date.now() }
          : ses,
      );
      writeToStorage(sessions);
      return { sessions };
    });

    const activeId = useAgentStore.getState().sessionId;
    if (activeId === id) {
      useAgentStore.getState().setSessionInfo({
        sessionId: id,
        sessionName: trimmed,
      });
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
}));

export const useFilteredSessions = (): SessionRecord[] => {
  const sessions = useSessionHistoryStore((s) => s.sessions);
  const searchQuery = useSessionHistoryStore((s) => s.searchQuery);
  return useMemo(
    () => filterSessions(sessions, searchQuery),
    [sessions, searchQuery],
  );
};
