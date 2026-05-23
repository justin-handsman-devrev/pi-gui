import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useAgentStore } from "@/stores/agentStore";
import { handleCanvasEvent } from "@/hooks/useCanvasSync";

/**
 * Hook that subscribes to Tauri agent events and dispatches to stores.
 * Call once at the app root.
 */
export function useAgentEvents() {
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    (async () => {
      unlistenRef.current = await listen<Record<string, unknown>>(
        "agent-event",
        (event) => {
          if (cancelledRef.current) return;
          handleEvent(event.payload);
        },
      );
    })();

    return () => {
      cancelledRef.current = true;
      unlistenRef.current?.();
      unlistenRef.current = null;
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
        // Extract text from content array
        const content = message.content as Array<Record<string, unknown>> | undefined;
        const text = extractTextFromContent(content);
        store.updateAssistantText(text);
      }
      break;
    }
    case "message_end": {
      const message = payload.message as Record<string, unknown> | undefined;
      if (message?.role === "assistant") {
        const content = message.content as Array<Record<string, unknown>> | undefined;
        const text = extractTextFromContent(content);
        store.updateAssistantText(text);
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
      const steering = (payload.steering as string[]) ?? [];
      const followUp = (payload.followUp as string[]) ?? [];
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
      break;
    }

    // ── Model/thinking changes ─────────────────────────────────────
    case "thinking_level_changed": {
      const level = payload.level as string;
      store.setThinkingLevel(level);
      break;
    }
    case "session_info_changed": {
      // Session name might change
      break;
    }

    // ── Turn lifecycle ─────────────────────────────────────────────
    case "turn_start":
    case "turn_end": {
      // Could be used for turn-level tracking
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

/**
 * Extract plain text from a pi agent content array.
 * Content is like: [{ type: "text", text: "hello" }, { type: "toolCall", ... }]
 */
function extractTextFromContent(
  content: Array<Record<string, unknown>> | undefined,
): string {
  if (!content || !Array.isArray(content)) return "";

  return content
    .filter((block) => block.type === "text")
    .map((block) => (block.text as string) ?? "")
    .join("");
}
