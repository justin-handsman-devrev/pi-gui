import { getState, getMessages, startAgent } from "@/lib/tauri-commands";
import { mapAgentMessages } from "@/lib/session-messages";
import {
  getActiveProjectCwd,
  isSameProjectPath,
  setActiveProjectCwd,
} from "@/lib/project-cwd";
import { useAgentStore } from "@/stores/agentStore";
import { initFileTree } from "@/lib/init-file-tree";
import { syncAgentQueuesFromState } from "@/lib/sync-agent-queues";
import { refreshSessionStats } from "@/lib/session-stats";
import { invalidateSlashCommandCache } from "@/lib/slash-commands";
import { useFileTreeStore } from "@/stores/fileTreeStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUIStore } from "@/stores/uiStore";

export async function loadProject(cwd: string): Promise<boolean> {
  const target = cwd.trim();
  if (!target) return false;

  const store = useAgentStore.getState();
  if (store.isStreaming) {
    useNotificationStore.getState().addNotification({
      type: "warning",
      title: "Wait for the agent",
      message: "Stop the current response before switching projects.",
    });
    return false;
  }

  if (isSameProjectPath(target, getActiveProjectCwd()) && store.sessionId) {
    return true;
  }

  try {
    await startAgent(target);
    invalidateSlashCommandCache();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const [state, messagesData] = await Promise.all([getState(), getMessages()]);
    const messages = mapAgentMessages(messagesData);

    store.loadSession({
      sessionId: state.sessionId,
      sessionName: state.sessionName,
      sessionFile: state.sessionFile,
      model: state.model,
      thinkingLevel: state.thinkingLevel,
      messages,
    });
    store.setStreaming(state.isStreaming);
    syncAgentQueuesFromState(state as unknown as Record<string, unknown>);
    void refreshSessionStats();

    setActiveProjectCwd(target);
    useFileTreeStore.getState().reset();
    void initFileTree(target);

    const name = target.split("/").filter(Boolean).pop() || target;
    useUIStore.getState().addProject({
      name,
      path: target,
      sessions: [],
      lastActive: new Date().toISOString(),
    });

    return true;
  } catch (error: unknown) {
    useNotificationStore.getState().addNotification({
      type: "error",
      title: "Could not load project",
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
