import { useMemo, useRef, useEffect } from "react";
import { FileCode2 } from "lucide-react";
import type { DiffInfo } from "@/canvas/canvasStore";
import type { DiffLine } from "@/lib/diff-parser";

/**
 * Full standalone unified-diff renderer.
 *
 * Shows a proper two-column diff with:
 *  - Red background + "- " prefix for deletions (with old line numbers)
 *  - Green background + "+ " prefix for additions (with new line numbers)
 *  - Muted context lines (with both line numbers)
 *  - Collapsed equal sections to keep the view focused
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

  const gutterWidth = Math.max(3, String(maxLineNo).length) * 8 + 12;

  if (allLines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-primary)] text-[var(--text-muted)]">
        <p className="text-sm">No diff available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* File path header */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3">
        <FileCode2 size={13} className="text-[var(--text-faint)]" />
        <span className="truncate text-xs text-[var(--text-secondary)] font-mono">
          {filePath}
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-faint)]">
          {countChanges(allLines)} changes
        </span>
      </div>

      {/* Diff content */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <pre
          className="m-0 min-w-full font-mono text-[13px] leading-[20px]"
          style={{ fontFamily: "var(--font-mono)" }}
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
  let textClass = "text-[var(--text-secondary)]";

  switch (type) {
    case "added":
      bgClass = "bg-[rgba(16,185,129,0.10)]";
      prefix = "+";
      textClass = "text-emerald-400";
      break;
    case "removed":
      bgClass = "bg-[rgba(239,68,68,0.10)]";
      prefix = "-";
      textClass = "text-red-400";
      break;
    case "context":
      bgClass = "";
      prefix = " ";
      textClass = "text-[var(--text-muted)]";
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
    <div className={`flex h-5 items-start ${bgClass}`}>
      {/* Old line number */}
      <div
        className="shrink-0 select-none text-right text-[11px] leading-[20px] text-[var(--text-faint)]"
        style={{ width: gutterWidth }}
      >
        {oldStr || "\u00A0"}
      </div>
      {/* New line number */}
      <div
        className="shrink-0 select-none border-r border-[var(--border-subtle)] text-right text-[11px] leading-[20px] text-[var(--text-faint)]"
        style={{ width: gutterWidth }}
      >
        {newStr || "\u00A0"}
      </div>
      {/* Prefix + content */}
      <div className={`flex min-w-0 flex-1 whitespace-pre ${textClass}`}>
        <span className="shrink-0 pl-2 pr-1 font-bold opacity-60">{prefix}</span>
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
  gutterWidth,
}: {
  entry: CollapsedLine & { kind: "skipped" };
  gutterWidth: number;
}) {
  return (
    <div className="flex h-5 items-center bg-[var(--bg-elevated)]">
      <div style={{ width: gutterWidth * 2 + 1 }} className="shrink-0" />
      <div className="flex items-center gap-2 pl-3 text-[11px] text-[var(--text-faint)]">
        <span className="h-px flex-1 max-w-[40px] bg-[var(--border-subtle)]" />
        <span>
          ⋯ {entry.count} lines hidden (L{entry.oldStart}→L{entry.newStart})
        </span>
        <span className="h-px flex-1 max-w-[40px] bg-[var(--border-subtle)]" />
      </div>
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
