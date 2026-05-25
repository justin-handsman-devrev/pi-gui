import type { Message } from "@/stores/agentStore";
import type { SessionRecord } from "@/stores/sessionHistoryStore";
import { useAgentStore } from "@/stores/agentStore";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  getState,
  switchSession,
  getMessages,
  resolveSessionPath,
} from "@/lib/tauri-commands";
import { mapAgentMessages, mapCachedSessionMessages } from "@/lib/session-messages";
import { getActiveProjectCwd, isSameProjectPath } from "@/lib/project-cwd";
import { loadProject } from "@/lib/load-project";
import { syncAgentQueuesFromState } from "@/lib/sync-agent-queues";
import { refreshSessionStats } from "@/lib/session-stats";
import type { SessionStatsSnapshot } from "@/lib/session-stats";

function loadIntoStore(payload: {
  sessionId: string;
  sessionName?: string;
  sessionFile?: string;
  model?: { provider: string; id: string };
  thinkingLevel?: string;
  sessionStats?: SessionStatsSnapshot;
  messages: Message[];
}) {
  useAgentStore.getState().loadSession(payload);
}

function loadCachedSession(session: SessionRecord) {
  loadIntoStore({
    sessionId: session.id,
    sessionName: session.name,
    sessionFile: session.sessionFile,
    model: session.model,
    messages: mapCachedSessionMessages(session.messages),
  });
}

async function resolvePathForSession(session: SessionRecord): Promise<string> {
  if (session.sessionFile) {
    return session.sessionFile;
  }

  return resolveSessionPath(session.id, session.cwd || getActiveProjectCwd());
}

export async function switchToSession(session: SessionRecord): Promise<void> {
  const store = useAgentStore.getState();
  if (session.id === store.sessionId) return;
  if (store.isStreaming) {
    useNotificationStore.getState().addNotification({
      type: "warning",
      title: "Wait for the agent",
      message: "Stop the current response before switching chats.",
    });
    return;
  }

  const activeCwd = getActiveProjectCwd();
  if (session.cwd && activeCwd && !isSameProjectPath(session.cwd, activeCwd)) {
    const loaded = await loadProject(session.cwd);
    if (!loaded) return;
  }

  let sessionPath: string;
  try {
    sessionPath = await resolvePathForSession(session);
  } catch (error: unknown) {
    console.error("[switchToSession] resolve path failed:", error);
    loadCachedSession(session);
    useNotificationStore.getState().addNotification({
      type: "warning",
      title: "Loaded cached chat",
      message: "Could not resolve session file; showing saved view only.",
    });
    return;
  }

  try {
    const switchResult = await switchSession(sessionPath) as { cancelled?: boolean };
    if (switchResult?.cancelled) return;

    const [messagesData, state] = await Promise.all([getMessages(), getState()]);
    const messages = mapAgentMessages(messagesData);

    if (messages.length === 0 && session.messages.length > 0) {
      loadCachedSession(session);
      return;
    }

    loadIntoStore({
      sessionId: state.sessionId || session.id,
      sessionName: state.sessionName || session.name,
      sessionFile: state.sessionFile ?? session.sessionFile ?? sessionPath,
      model: state.model ?? session.model,
      thinkingLevel: state.thinkingLevel,
      messages,
    });
    syncAgentQueuesFromState(state as unknown as Record<string, unknown>);
    void refreshSessionStats();
  } catch (error: unknown) {
    console.error("[switchToSession] failed:", error);
    loadCachedSession(session);

    useNotificationStore.getState().addNotification({
      type: "warning",
      title: session.messages.length > 0 ? "Loaded cached chat" : "Loaded empty chat",
      message: session.messages.length > 0
        ? "Showing saved messages; agent context may differ."
        : "Showing saved session; agent context may differ.",
    });
  }
}
