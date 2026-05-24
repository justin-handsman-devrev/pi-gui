import { useMemo, useRef, useEffect } from "react";
import { FileCode2 } from "lucide-react";
import type { DiffInfo } from "@/canvas/canvasStore";
import type { DiffLine } from "@/lib/diff-parser";

/**
 * Full standalone unified-diff renderer.
 *
 * Shows a proper two-column diff with:
 *  - Aurora-mint background for additions
 *  - Aurora-rose background for deletions
 *  - Muted context lines with warm ink colors
 *  - Collapsed equal sections to keep the view focused
 *
 * ElevenLabs-inspired design: warm dark ink colors, aurora-tinted diff highlights.
 */
interface DiffRendererProps {
  diffs: DiffInfo[];
  filePath: string;
}

export default function DiffRenderer({ diffs, filePath }: DiffRendererProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Merge all diff parsed lines into one sequence, newest last
  const allLines = useMemo((): DiffLine[] => {
    const merged: DiffLine[] = [];
    for (const diff of diffs) {
      merged.push(...diff.parsedLines);
    }
    return merged;
  }, [diffs]);

  // Collapse runs of 4+ context lines to just the first 2 and last 2
  const collapsed = useMemo((): CollapsedLine[] => {
    const result: CollapsedLine[] = [];
    let contextRun: DiffLine[] = [];

    const flushContext = () => {
      if (contextRun.length === 0) return;
      if (contextRun.length <= 6) {
        // Keep all context lines
        for (const l of contextRun) {
          result.push({ kind: "line", line: l });
        }
      } else {
        // Keep first 2, add a "skipped" marker, keep last 2
        for (let i = 0; i < 2; i++) {
          result.push({ kind: "line", line: contextRun[i] });
        }
        result.push({
          kind: "skipped",
          count: contextRun.length - 4,
          oldStart: contextRun[2].oldLineNo ?? 0,
          newStart: contextRun[2].newLineNo ?? 0,
        });
        for (let i = contextRun.length - 2; i < contextRun.length; i++) {
          result.push({ kind: "line", line: contextRun[i] });
        }
      }
      contextRun = [];
    };

    for (const line of allLines) {
      if (line.type === "context") {
        contextRun.push(line);
      } else {
        flushContext();
        result.push({ kind: "line", line });
      }
    }
    flushContext();

    return result;
  }, [allLines]);

  // Scroll to first changed line on mount or when diffs change
  const firstChangedIdx = useMemo(
    () => collapsed.findIndex((c) => c.kind === "line" && c.line.type !== "context"),
    [collapsed],
  );

  useEffect(() => {
    if (firstChangedIdx >= 0 && scrollRef.current) {
      const target = scrollRef.current.children[1]?.children[firstChangedIdx] as HTMLElement | undefined;
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [firstChangedIdx]);

  // Compute gutter width
  const maxLineNo = useMemo(() => {
    let max = 0;
    for (const c of collapsed) {
      if (c.kind === "line") {
        if (c.line.oldLineNo != null) max = Math.max(max, c.line.oldLineNo);
        if (c.line.newLineNo != null) max = Math.max(max, c.line.newLineNo);
      }
    }
    return max;
  }, [collapsed]);

  const gutterWidth = Math.max(3, String(maxLineNo).length) * 8 + 16;

  if (allLines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0a09] text-[#78716c]">
        <p className="text-sm">No diff available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0c0a09]">
      {/* File path header */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[rgba(255,255,255,0.06)] bg-[#131210] px-4">
        <FileCode2 size={13} className="text-[#57534e]" />
        <span className="truncate text-xs text-[#a8a29e] font-mono">
          {filePath}
        </span>
        <span className="ml-auto text-[10px] text-[#57534e]">
          {countChanges(allLines)} changes
        </span>
      </div>

      {/* Diff content */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <pre
          className="m-0 min-w-full font-mono text-[13px] leading-[22px]"
          style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace" }}
        >
          {collapsed.map((entry, i) => {
            if (entry.kind === "skipped") {
              return <SkippedLines key={`skip-${i}`} entry={entry} gutterWidth={gutterWidth * 2 + 24} />;
            }
            return (
              <DiffLineRow
                key={`line-${i}`}
                line={entry.line}
                gutterWidth={gutterWidth}
              />
            );
          })}
        </pre>
      </div>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type CollapsedLine =
  | { kind: "line"; line: DiffLine }
  | { kind: "skipped"; count: number; oldStart: number; newStart: number };

// ── Sub-components ───────────────────────────────────────────────────────────

function DiffLineRow({
  line,
  gutterWidth,
}: {
  line: DiffLine;
  gutterWidth: number;
}) {
  const { type, content, oldLineNo, newLineNo } = line;

  let bgClass = "";
  let prefix = " ";
  let textClass = "text-[#a8a29e]";
  let numClass = "text-[#57534e]";

  switch (type) {
    case "added":
      // Aurora-mint for additions
      bgClass = "bg-[#5fb8a3]/10";
      prefix = "+";
      textClass = "text-[#5fb8a3]";
      numClass = "text-[#5fb8a3]/50";
      break;
    case "removed":
      // Aurora-rose for deletions
      bgClass = "bg-[#c494a4]/10";
      prefix = "-";
      textClass = "text-[#c494a4]";
      numClass = "text-[#c494a4]/50";
      break;
    case "context":
      bgClass = "";
      prefix = " ";
      textClass = "text-[#78716c]";
      numClass = "text-[#57534e]";
      break;
  }

  const oldStr = type !== "added" && oldLineNo != null ? String(oldLineNo) : "";
  const newStr = type !== "removed" && newLineNo != null ? String(newLineNo) : "";

  // Escape HTML in content
  const safeContent = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return (
    <div className={`flex h-[22px] items-start ${bgClass}`}>
      {/* Old line number */}
      <div
        className={`shrink-0 select-none text-right text-[11px] leading-[22px] ${numClass}`}
        style={{ width: gutterWidth }}
      >
        {oldStr || "\u00A0"}
      </div>
      {/* New line number */}
      <div
        className={`shrink-0 select-none border-r border-[rgba(255,255,255,0.06)] text-right text-[11px] leading-[22px] ${numClass}`}
        style={{ width: gutterWidth }}
      >
        {newStr || "\u00A0"}
      </div>
      {/* Prefix + content */}
      <div className={`flex min-w-0 flex-1 whitespace-pre ${textClass}`}>
        <span className="shrink-0 pl-3 pr-1 font-bold opacity-60">{prefix}</span>
        <span
          className="flex-1"
          dangerouslySetInnerHTML={{ __html: safeContent || "&nbsp;" }}
        />
      </div>
    </div>
  );
}

function SkippedLines({
  entry,
}: {
  entry: CollapsedLine & { kind: "skipped" };
  gutterWidth: number;
}) {
  return (
    <div className="flex h-[22px] items-center bg-[#1c1917]/50">
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-4 text-[11px] text-[#57534e]">
        <span className="h-px w-6 bg-[#44403c]" />
        <span>
          ⋯ {entry.count} lines hidden
        </span>
        <span className="h-px w-6 bg-[#44403c]" />
      </div>
      <div className="flex-1" />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function countChanges(lines: DiffLine[]): number {
  let count = 0;
  for (const line of lines) {
    if (line.type === "added" || line.type === "removed") count++;
  }
  return count;
}
