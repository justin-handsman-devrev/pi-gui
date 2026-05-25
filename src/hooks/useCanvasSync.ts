import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/canvas/canvasStore";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { parseUnifiedDiff, type DiffLine } from "@/lib/diff-parser";

// ── Types ────────────────────────────────────────────────────────────────────

interface CanvasToolEvent {
  type: "tool_execution_start" | "tool_execution_end";
  toolName?: string;
  toolCallId?: string;
  args?: unknown;
  result?: unknown;
  isError?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function openCanvasIfEnabled(): void {
  const ui = useUIStore.getState();
  if (ui.settings.canvasAutoOpen) {
    ui.setCanvasVisible(true);
  }
}

function extractFilePath(args: unknown): string {
  const a = args as { path?: string; file_path?: string } | null;
  return a?.path ?? a?.file_path ?? "";
}

function findFirstChangedLine(parsedLines: DiffLine[]): number | undefined {
  for (const line of parsedLines) {
    if (line.type === "added" || line.type === "removed") {
      return line.newLineNo ?? line.oldLineNo;
    }
  }
  return undefined;
}

// ── Core handler (called from useAgentEvents) ───────────────────────────────

export function handleCanvasEvent(event: CanvasToolEvent): void {
  const canvas = useCanvasStore.getState();
  const { toolName = "", toolCallId = "" } = event;

  // ── edit tool start ──────────────────────────────────────────────────────
  if (event.type === "tool_execution_start" && toolName === "edit") {
    const filePath = extractFilePath(event.args);
    if (!filePath) return;

    openCanvasIfEnabled();
    canvas.openFile(filePath, "");
    canvas.setStreaming(filePath, true);
    canvas.setActiveFile(filePath);
    return;
  }

  // ── write tool start ─────────────────────────────────────────────────────
  if (event.type === "tool_execution_start" && toolName === "write") {
    const filePath = extractFilePath(event.args);
    if (!filePath) return;

    const args = event.args as { content?: string } | null;
    const content = args?.content ?? "";

    openCanvasIfEnabled();
    canvas.openFile(filePath, content);
    canvas.setStreaming(filePath, true);
    canvas.setActiveFile(filePath);
    return;
  }

  // ── edit tool end ────────────────────────────────────────────────────────
  if (event.type === "tool_execution_end" && toolName === "edit") {
    // Try to get file path from event args first, fall back to agentStore
    const fallbackArgs = toolCallId
      ? useAgentStore.getState().toolCalls[toolCallId]?.args
      : undefined;
    const filePath = extractFilePath(event.args ?? fallbackArgs);
    if (!filePath) return;

    // Try to extract diff from result
    const result = event.result as {
      details?: { diff?: string; patch?: string };
    } | null;
    const diffText = result?.details?.diff ?? result?.details?.patch ?? "";

    if (diffText) {
      const parsedLines = parseUnifiedDiff(diffText);
      const firstChangedLine = findFirstChangedLine(parsedLines);

      canvas.addDiff(filePath, {
        toolCallId,
        diff: diffText,
        parsedLines,
        firstChangedLine,
      });
    }

    canvas.setStreaming(filePath, false);
    canvas.setActiveFile(filePath);
    // Auto-switch to diff view when an edit completes
    canvas.setViewMode("diff");
    return;
  }

  // ── write tool end ───────────────────────────────────────────────────────
  if (event.type === "tool_execution_end" && toolName === "write") {
    const fallbackArgs = toolCallId
      ? useAgentStore.getState().toolCalls[toolCallId]?.args
      : undefined;
    const filePath = extractFilePath(event.args ?? fallbackArgs);
    if (!filePath) return;

    canvas.setStreaming(filePath, false);
    canvas.setActiveFile(filePath);
    return;
  }
}

// ── React hook (called once at app root) ────────────────────────────────────

/**
 * Bridges agent tool-call events into the canvas store.
 *
 * This hook subscribes to the agentStore's toolCalls map and reacts when
 * `edit` / `write` tool executions start and end — providing a fallback path
 * for cases where the event-based handler in useAgentEvents misses a status
 * transition.
 *
 * Call once at the app root:
 * ```tsx
 * useCanvasSync();
 * ```
 */
export function useCanvasSync(): void {
  const toolCalls = useAgentStore((s) => s.toolCalls);
  const prevKeysRef = useRef<string[]>([]);
  const processedEndRef = useRef(new Set<string>());

  useEffect(() => {
    const canvas = useCanvasStore.getState();
    const keys = Object.keys(toolCalls);
    const prevKeys = prevKeysRef.current;

    // Detect newly added tool calls
    const addedKeys = keys.filter((k) => !prevKeys.includes(k));

    for (const id of addedKeys) {
      const tc = toolCalls[id];
      if (!tc) continue;

      if (tc.status === "running") {
        if (tc.toolName === "edit") {
          const filePath = extractFilePath(tc.args);
          if (!filePath) continue;

          openCanvasIfEnabled();
          canvas.openFile(filePath, "");
          canvas.setStreaming(filePath, true);
          canvas.setActiveFile(filePath);
        }

        if (tc.toolName === "write") {
          const args = tc.args as { content?: string } | null;
          const filePath = extractFilePath(tc.args);
          if (!filePath) continue;

          openCanvasIfEnabled();
          canvas.openFile(filePath, args?.content ?? "");
          canvas.setStreaming(filePath, true);
          canvas.setActiveFile(filePath);
        }
      }
    }

    // Detect newly completed tool calls
    for (const id of keys) {
      if (processedEndRef.current.has(id)) continue;
      const tc = toolCalls[id];
      if (!tc || tc.status === "running") continue;

      processedEndRef.current.add(id);

      if (tc.toolName === "edit") {
        const filePath = extractFilePath(tc.args);
        if (!filePath) continue;

        const result = tc.result as {
          details?: { diff?: string; patch?: string };
        } | null;
        const diffText = result?.details?.diff ?? result?.details?.patch ?? "";

        if (diffText) {
          const parsedLines = parseUnifiedDiff(diffText);
          const firstChangedLine = findFirstChangedLine(parsedLines);

          canvas.addDiff(filePath, {
            toolCallId: id,
            diff: diffText,
            parsedLines,
            firstChangedLine,
          });
        }

        canvas.setStreaming(filePath, false);
        canvas.setActiveFile(filePath);
        canvas.setViewMode("diff");
      }

      if (tc.toolName === "write") {
        const filePath = extractFilePath(tc.args);
        if (!filePath) continue;

        canvas.setStreaming(filePath, false);
        canvas.setActiveFile(filePath);
      }
    }

    prevKeysRef.current = keys;
  }, [toolCalls]);
}
