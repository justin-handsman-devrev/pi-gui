import { useEffect, useRef } from "react";
import { useCanvasStore, type DiffInfo } from "@/canvas/canvasStore";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { parseUnifiedDiff, type DiffLine } from "@/lib/diff-parser";

/**
 * Bridge agent tool-call events into the canvas store.
 *
 * Call once at the app root:
 * ```tsx
 * useCanvasSync();
 * ```
 *
 * Internally subscribes to the agentStore's toolCalls map and reacts when
 * `edit` / `write` tool executions start and end.
 */
export function useCanvasSync(): void {
  const toolCalls = useAgentStore((s) => s.toolCalls);
  const prevSizeRef = useRef(0);
  const processedEndRef = useRef(new Set<string>());

  useEffect(() => {
    const canvas = useCanvasStore.getState();
    const ui = useUIStore.getState();

    const keys = Object.keys(toolCalls);
    const newKeys = keys.slice(prevSizeRef.current);
    prevSizeRef.current = keys.length;

    for (const id of newKeys) {
      const tc = toolCalls[id];
      if (!tc) continue;

      // ── edit tool ────────────────────────────────────────────────────────
      if (tc.toolName === "edit" && tc.status === "running") {
        const args = tc.args as {
          path?: string;
          file_path?: string;
          edits?: Array<{ oldText: string; newText: string }>;
        };
        const filePath = args.path ?? args.file_path ?? "";
        if (!filePath) continue;

        // Auto-open canvas
        ui.setCanvasVisible(true);

        // Add file if not present
        if (!canvas.files.has(filePath)) {
          canvas.addFile(filePath, "");
        }

        canvas.setFileStreaming(filePath, true);
        canvas.setActiveFile(filePath);
      }

      // ── write tool ───────────────────────────────────────────────────────
      if (tc.toolName === "write" && tc.status === "running") {
        const args = tc.args as {
          path?: string;
          file_path?: string;
          content?: string;
        };
        const filePath = args.path ?? args.file_path ?? "";
        if (!filePath) continue;

        ui.setCanvasVisible(true);
        canvas.addFile(filePath, args.content ?? "");
        canvas.setFileStreaming(filePath, true);
      }
    }

    // Check for newly completed tool calls
    for (const id of keys) {
      if (processedEndRef.current.has(id)) continue;
      const tc = toolCalls[id];
      if (!tc || tc.status === "running") continue;

      processedEndRef.current.add(id);

      // ── edit tool end ──────────────────────────────────────────────────
      if (tc.toolName === "edit") {
        const args = tc.args as {
          path?: string;
          file_path?: string;
        };
        const filePath = args.path ?? args.file_path ?? "";
        if (!filePath) continue;

        const result = tc.result as {
          details?: { diff?: string; patch?: string };
        } | null;
        const diffText =
          result?.details?.diff ?? result?.details?.patch ?? "";

        if (diffText) {
          const parsedLines = parseUnifiedDiff(diffText);
          const firstChangedLine = findFirstChangedLine(parsedLines);

          const diffInfo: DiffInfo = {
            toolCallId: id,
            diff: diffText,
            parsedLines,
            firstChangedLine,
          };

          if (!canvas.files.has(filePath)) {
            canvas.addFile(filePath, "");
          }
          canvas.addDiff(filePath, diffInfo);
        }

        canvas.setFileStreaming(filePath, false);
        canvas.setActiveFile(filePath);
      }

      // ── write tool end ─────────────────────────────────────────────────
      if (tc.toolName === "write") {
        const args = tc.args as {
          path?: string;
          file_path?: string;
        };
        const filePath = args.path ?? args.file_path ?? "";
        if (!filePath) continue;

        canvas.setFileStreaming(filePath, false);
        canvas.setActiveFile(filePath);
      }
    }
  }, [toolCalls]);
}

/**
 * Standalone handler that can be called from useAgentEvents for tool events.
 * This is an alternative integration point if the hook-based approach is
 * not desired.
 */
export function handleCanvasEvent(event: {
  type: string;
  toolName?: string;
  toolCallId?: string;
  args?: unknown;
  result?: unknown;
  isError?: boolean;
}): void {
  const canvas = useCanvasStore.getState();
  const ui = useUIStore.getState();

  const toolName = event.toolName ?? "";
  const toolCallId = event.toolCallId ?? "";

  if (event.type === "tool_execution_start") {
    if (toolName === "edit") {
      const args = event.args as {
        path?: string;
        file_path?: string;
        edits?: Array<{ oldText: string; newText: string }>;
      };
      const filePath = args.path ?? args.file_path ?? "";
      if (!filePath) return;

      ui.setCanvasVisible(true);
      if (!canvas.files.has(filePath)) {
        canvas.addFile(filePath, "");
      }
      canvas.setFileStreaming(filePath, true);
      canvas.setActiveFile(filePath);
    }

    if (toolName === "write") {
      const args = event.args as {
        path?: string;
        file_path?: string;
        content?: string;
      };
      const filePath = args.path ?? args.file_path ?? "";
      if (!filePath) return;

      ui.setCanvasVisible(true);
      canvas.addFile(filePath, args.content ?? "");
      canvas.setFileStreaming(filePath, true);
    }
  }

  if (event.type === "tool_execution_end") {
    if (toolName === "edit") {
      const args = event.args as {
        path?: string;
        file_path?: string;
      };
      const filePath = args.path ?? args.file_path ?? "";
      if (!filePath) return;

      const result = event.result as {
        details?: { diff?: string; patch?: string };
      } | null;
      const diffText = result?.details?.diff ?? result?.details?.patch ?? "";

      if (diffText) {
        const parsedLines = parseUnifiedDiff(diffText);
        const firstChangedLine = findFirstChangedLine(parsedLines);

        const diffInfo: DiffInfo = {
          toolCallId,
          diff: diffText,
          parsedLines,
          firstChangedLine,
        };

        if (!canvas.files.has(filePath)) {
          canvas.addFile(filePath, "");
        }
        canvas.addDiff(filePath, diffInfo);
      }

      canvas.setFileStreaming(filePath, false);
      canvas.setActiveFile(filePath);
    }

    if (toolName === "write") {
      const args = event.args as {
        path?: string;
        file_path?: string;
      };
      const filePath = args.path ?? args.file_path ?? "";
      if (!filePath) return;

      canvas.setFileStreaming(filePath, false);
      canvas.setActiveFile(filePath);
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findFirstChangedLine(
  parsedLines: DiffLine[],
): number | undefined {
  for (const line of parsedLines) {
    if (line.type === "added" || line.type === "removed") {
      return line.newLineNo ?? line.oldLineNo;
    }
  }
  return undefined;
}
