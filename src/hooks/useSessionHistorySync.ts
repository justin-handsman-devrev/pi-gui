import { useEffect } from "react";
import { useAgentStore } from "@/stores/agentStore";
import { useSessionHistoryStore } from "@/stores/sessionHistoryStore";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import { isGenericSessionTitle, resolveSessionName } from "@/lib/session-title";

/**
 * Persists the active session to local session history as messages arrive.
 */
export function useSessionHistorySync() {
  const sessionId = useAgentStore((s) => s.sessionId);
  const sessionName = useAgentStore((s) => s.sessionName);
  const sessionFile = useAgentStore((s) => s.sessionFile);
  const messages = useAgentStore((s) => s.messages);
  const model = useAgentStore((s) => s.model);
  const saveSession = useSessionHistoryStore((s) => s.saveSession);
  const loadSessions = useSessionHistoryStore((s) => s.loadSessions);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!sessionId) return;

    const cwd = getActiveProjectCwd();
    const existing = useSessionHistoryStore.getState().sessions.find((s) => s.id === sessionId);
    const now = Date.now();

    const mappedMessages = messages.map((m, i) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      thinking: m.thinking,
      preamble: m.preamble,
      toolCalls: m.toolCalls,
      timestamp: existing?.messages[i]?.timestamp ?? now,
    }));

    const name = resolveSessionName({
      sessionName,
      existingName: existing?.name,
      titleLocked: existing?.titleLocked,
      messages: mappedMessages,
    });

    saveSession({
      id: sessionId,
      name,
      cwd,
      messages: mappedMessages,
      model,
      sessionFile: sessionFile || existing?.sessionFile,
      titleLocked: existing?.titleLocked,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    if (
      !sessionName?.trim() &&
      !isGenericSessionTitle(name) &&
      useAgentStore.getState().sessionName !== name
    ) {
      useAgentStore.getState().setSessionInfo({
        sessionId,
        sessionName: name,
        sessionFile,
      });
    }
  }, [sessionId, sessionName, sessionFile, messages, model, saveSession]);
}
