import { useMemo } from "react";
import type { DiffInfo } from "@/canvas/canvasStore";

interface DiffRendererProps {
  diffs: DiffInfo[];
  /** Current file content — reserved for future line-count-based positioning. */
  content: string;
}

/**
 * Overlay diff highlights on the code content.
 *
 * Renders removed lines above the replacement and highlights added lines
 * inline within the code view. Line positions are matched against the
 * current content by line number.
 */
export default function DiffRenderer({ diffs }: DiffRendererProps) {
  // Build a map: line number (1-based) → { added: string[], removed: string[] }
  const lineHighlights = useMemo(() => {
    const map = new Map<
      number,
      { added: string[]; removed: string[] }
    >();

    for (const diff of diffs) {
      let lastNewLine: number | undefined;

      for (const line of diff.parsedLines) {
        if (line.type === "removed") {
          // Removed lines are shown at the position of the next added line
          // or the current new line context
          const targetLine = line.newLineNo ?? lastNewLine ?? line.oldLineNo ?? 1;
          const entry = map.get(targetLine) ?? { added: [], removed: [] };
          entry.removed.push(line.content);
          map.set(targetLine, entry);
        }

        if (line.type === "added") {
          const targetLine = line.newLineNo ?? 1;
          const entry = map.get(targetLine) ?? { added: [], removed: [] };
          entry.added.push(line.content);
          map.set(targetLine, entry);
          lastNewLine = targetLine;
        }

        if (line.type === "context") {
          lastNewLine = line.newLineNo;
        }
      }
    }

    return map;
  }, [diffs]);

  // Only render removed lines as they need a separate row above the code line.
  // Added lines are already highlighted inline by CanvasEditor via diffLineMap.
  const removedBlocks = useMemo(() => {
    const blocks: Array<{
      afterLineNo: number;
      lines: string[];
    }> = [];

    const sorted = [...lineHighlights.entries()].sort(
      (a, b) => a[0] - b[0],
    );

    for (const [lineNo, entry] of sorted) {
      if (entry.removed.length > 0) {
        blocks.push({ afterLineNo: lineNo, lines: entry.removed });
      }
    }

    return blocks;
  }, [lineHighlights]);

  if (removedBlocks.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 top-0">
      {removedBlocks.map((block) => {
        // Position above the target line
        const topPx = Math.max(0, (block.afterLineNo - 1)) * 20;
        return (
          <div
            key={`removed-${block.afterLineNo}`}
            className="absolute left-0 right-0"
            style={{ top: topPx - block.lines.length * 20 }}
          >
            {block.lines.map((line, i) => (
              <div
                key={i}
                className="flex h-5 items-center border-l-2 border-l-accent-red bg-[#3a1a1a] pl-2 text-xs text-accent-red/70 line-through"
              >
                {line || "\u00A0"}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
