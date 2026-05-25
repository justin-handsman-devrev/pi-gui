import { useEffect } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useAgentStore } from "@/stores/agentStore";
import { handleCanvasEvent } from "@/hooks/useCanvasSync";
import { parseAssistantContent } from "@/lib/assistant-content";
import { parseQueueUpdate } from "@/lib/queue-utils";
import { refreshSessionStats } from "@/lib/session-stats";

/**
 * Hook that subscribes to Tauri agent events and dispatches to stores.
 * Call once at the app root.
 */
export function useAgentEvents() {
  useEffect(() => {
    let cancelled = false;
    let unlisten: UnlistenFn | null = null;

    void listen<Record<string, unknown>>("agent-event", (event) => {
      if (cancelled) return;
      handleEvent(event.payload);
    }).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
      unlisten = null;
    };
  }, []);
}

function handleEvent(payload: Record<string, unknown>) {
  const store = useAgentStore.getState();
  const eventType = payload.type as string;

  switch (eventType) {
    // ── Agent lifecycle ────────────────────────────────────────────
    case "agent_start": {
      store.setStreaming(true);
      break;
    }
    case "agent_end": {
      store.setStreaming(false);
      store.endAssistantMessage();
      void refreshSessionStats();
      break;
    }

    // ── Message streaming ──────────────────────────────────────────
    case "message_start": {
      const message = payload.message as Record<string, unknown> | undefined;
      if (message?.role === "assistant") {
        store.startAssistantMessage();
      }
      break;
    }
    case "message_update": {
      const message = payload.message as Record<string, unknown> | undefined;
      if (message?.role === "assistant") {
        const content = message.content as Array<Record<string, unknown>> | undefined;
        const messages = useAgentStore.getState().messages;
        const last = messages[messages.length - 1];
        const hasToolCalls = (last?.toolCalls.length ?? 0) > 0;
        store.updateAssistantContent(parseAssistantContent(content, hasToolCalls));
      }
      break;
    }
    case "message_end": {
      const message = payload.message as Record<string, unknown> | undefined;
      if (message?.role === "assistant") {
        const content = message.content as Array<Record<string, unknown>> | undefined;
        const messages = useAgentStore.getState().messages;
        const last = messages[messages.length - 1];
        const hasToolCalls = (last?.toolCalls.length ?? 0) > 0;
        store.updateAssistantContent(parseAssistantContent(content, hasToolCalls));
      }
      break;
    }

    // ── Tool execution ─────────────────────────────────────────────
    case "tool_execution_start": {
      const toolCallId = payload.toolCallId as string;
      const toolName = payload.toolName as string;
      const args = payload.args;
      store.startToolCall(toolCallId, toolName, args);
      // Also forward to canvas
      handleCanvasEvent({
        type: "tool_execution_start",
        toolName,
        toolCallId,
        args,
      });
      break;
    }
    case "tool_execution_update": {
      const toolCallId = payload.toolCallId as string;
      const partialResult = payload.partialResult;
      store.updateToolCall(toolCallId, partialResult);
      break;
    }
    case "tool_execution_end": {
      const toolCallId = payload.toolCallId as string;
      const toolName = payload.toolName as string;
      const result = payload.result;
      const isError = payload.isError as boolean;
      store.endToolCall(toolCallId, result, isError);
      // Also forward to canvas
      handleCanvasEvent({
        type: "tool_execution_end",
        toolName,
        toolCallId,
        result,
        isError,
        args: undefined,
      });
      break;
    }

    // ── Queue updates ──────────────────────────────────────────────
    case "queue_update": {
      const { steering, followUp } = parseQueueUpdate(payload);
      store.setQueues(steering, followUp);
      break;
    }

    // ── Compaction ─────────────────────────────────────────────────
    case "compaction_start": {
      store.setCompacting(true);
      break;
    }
    case "compaction_end": {
      store.setCompacting(false);
      void refreshSessionStats();
      break;
    }

    // ── Model/thinking changes ─────────────────────────────────────
    case "thinking_level_changed": {
      const level = payload.level as string;
      store.setThinkingLevel(level);
      break;
    }
    case "session_info_changed": {
      const info = payload.info as Record<string, unknown> | undefined;
      if (info) {
        store.setSessionInfo({
          sessionId: (info.sessionId as string) || store.sessionId,
          sessionName: info.sessionName as string | undefined,
          sessionFile: info.sessionFile as string | undefined,
        });
      }
      break;
    }

    // ── Turn lifecycle ─────────────────────────────────────────────
    case "turn_start":
    case "turn_end": {
      if (eventType === "turn_end") {
        void refreshSessionStats();
      }
      break;
    }

    // ── Extension UI ───────────────────────────────────────────────
    case "extension_ui_request": {
      // TODO: handle extension UI requests (select, confirm, input dialogs)
      console.log("[pi-gui] extension_ui_request:", payload);
      break;
    }

    default: {
      // Unknown event type — log for debugging
      console.log("[pi-gui] unhandled event:", eventType, payload);
    }
  }
}
