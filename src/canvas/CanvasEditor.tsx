import { useMemo, useRef, useEffect } from "react";
import hljs from "highlight.js";
import { useCanvasStore } from "@/canvas/canvasStore";

/**
 * Read-only syntax-highlighted code editor for the active canvas file.
 * Shows line numbers, a streaming cursor, and subtle diff gutter markers.
 */
export default function CanvasEditor() {
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const file = useCanvasStore((s) =>
    s.activeFilePath ? s.files.get(s.activeFilePath) : undefined,
  );

  if (!activeFilePath || !file) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-primary)] text-[var(--text-muted)]">
        <p className="text-sm">Select a file to view</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--bg-primary)]">
      <CodeView
        content={file.currentContent}
        language={file.language}
        isStreaming={file.isStreaming}
        diffLineTypes={file.diffs.length > 0 ? buildDiffLineSet(file.diffs) : null}
      />
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CodeViewProps {
  content: string;
  language: string | undefined;
  isStreaming: boolean;
  diffLineTypes: Map<number, "added" | "removed" | "changed"> | null;
}

interface HighlightedBlock {
  html: string; // highlighted HTML for a batch of lines
  startLine: number; // 1-based first line
  lineCount: number;
}

// ── Code view with virtual scrolling for large files ─────────────────────────

function CodeView({ content, language, isStreaming, diffLineTypes }: CodeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Split content into lines
  const lines = useMemo(() => content.split("\n"), [content]);

  // Highlight in batches for performance
  const highlighted = useMemo((): HighlightedBlock[] => {
    if (lines.length === 0) {
      return [{ html: "", startLine: 1, lineCount: 1 }];
    }

    // For small files, highlight in one go
    if (lines.length <= 2000) {
      const html = highlightContent(content, language);
      const htmlLines = html.split("\n");
      // Pad to match source line count
      while (htmlLines.length < lines.length) htmlLines.push("");
      return [{ html: htmlLines.join("\n"), startLine: 1, lineCount: htmlLines.length }];
    }

    // For large files, batch in chunks of 500 lines
    const batchSize = 500;
    const blocks: HighlightedBlock[] = [];
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize).join("\n");
      const html = highlightContent(batch, language);
      blocks.push({
        html,
        startLine: i + 1,
        lineCount: Math.min(batchSize, lines.length - i),
      });
    }
    return blocks;
  }, [content, language, lines]);

  const totalLines = lines.length;

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isStreaming, content]);

  // Determine gutter width based on line count digits
  const gutterWidth = Math.max(3, String(totalLines).length) * 8 + 16;

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto">
      <pre className="m-0 flex min-w-full font-mono text-[13px] leading-[20px]" style={{ fontFamily: "var(--font-mono)" }}>
        {/* Line number gutter */}
        <div
          className="sticky left-0 z-10 shrink-0 select-none border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] text-right"
          style={{ width: gutterWidth }}
          aria-hidden="true"
        >
          {Array.from({ length: totalLines }, (_, i) => (
            <div key={i} className="h-5 px-2 text-[11px] leading-[20px] text-[var(--text-faint)]">
              {i + 1}
            </div>
          ))}
          {isStreaming && (
            <div className="h-5 px-2 text-[11px] leading-[20px] text-[var(--accent-primary)]">
              ◆
            </div>
          )}
        </div>

        {/* Code area */}
        <code className="flex-1 min-w-0 p-0">
          {highlighted.map((block) => {
            const htmlLines = block.html.split("\n");

            return htmlLines.map((lineHtml, j) => {
              const lineNo = block.startLine + j;
              const diffType = diffLineTypes?.get(lineNo);

              return (
                <div
                  key={`${block.startLine}-${j}`}
                  className={`flex h-5 items-start ${diffLineStyle(diffType)}`}
                >
                  <span
                    className="whitespace-pre"
                    dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }}
                  />
                </div>
              );
            });
          })}

          {/* Streaming cursor */}
          {isStreaming && (
            <div className="flex h-5 items-center">
              <span className="inline-block h-4 w-2 bg-[var(--accent-primary)] cursor-blink" />
            </div>
          )}
        </code>
      </pre>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function highlightContent(code: string, language: string | undefined): string {
  if (!code) return "";
  try {
    if (language && language !== "plaintext") {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    // Fallback: escape HTML
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

function diffLineStyle(type: "added" | "removed" | "changed" | undefined): string {
  switch (type) {
    case "added":
      return "bg-[rgba(16,185,129,0.08)] border-l-2 border-l-emerald-500/60";
    case "removed":
      return "bg-[rgba(239,68,68,0.06)] border-l-2 border-l-red-500/60 line-through opacity-70";
    case "changed":
      return "bg-[rgba(139,92,246,0.08)] border-l-2 border-l-violet-500/60";
    default:
      return "";
  }
}

import type { DiffInfo } from "@/canvas/canvasStore";

/**
 * Build a map from line number (1-based in the new file) to the diff type
 * so the code editor can show subtle gutter highlights.
 */
function buildDiffLineSet(
  diffs: DiffInfo[],
): Map<number, "added" | "removed" | "changed"> {
  const map = new Map<number, "added" | "removed" | "changed">();

  for (const diff of diffs) {
    for (const line of diff.parsedLines) {
      if (line.type === "added" && line.newLineNo != null) {
        map.set(line.newLineNo, "added");
      }
      if (line.type === "removed" && line.oldLineNo != null) {
        // Removed lines don't have a corresponding new line, but we can mark
        // the line where they were removed
        if (!map.has(line.oldLineNo)) {
          map.set(line.oldLineNo, "removed");
        }
      }
    }
  }

  return map;
}
