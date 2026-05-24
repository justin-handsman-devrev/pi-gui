import { useMemo, useRef, useEffect } from "react";
import hljs from "highlight.js";
import { useCanvasStore } from "@/canvas/canvasStore";

/**
 * Read-only syntax-highlighted code editor for the active canvas file.
 * Shows line numbers, a streaming cursor, and subtle diff gutter markers.
 *
 * ElevenLabs-inspired design: warm dark ink canvas (#0c0a09), aurora-tinted diff lines.
 */
export default function CanvasEditor() {
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const file = useCanvasStore((s) =>
    s.activeFilePath ? s.files.get(s.activeFilePath) : undefined,
  );

  if (!activeFilePath || !file) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0a09] text-[#78716c]">
        <p className="text-sm">Select a file to view</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0c0a09]">
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
  const gutterWidth = Math.max(3, String(totalLines).length) * 8 + 24;

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto">
      <pre className="m-0 flex min-w-full font-mono text-[13px] leading-[22px]" style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace" }}>
        {/* Line number gutter */}
        <div
          className="sticky left-0 z-10 shrink-0 select-none border-r border-[rgba(255,255,255,0.06)] bg-[#0c0a09] text-right"
          style={{ width: gutterWidth }}
          aria-hidden="true"
        >
          {Array.from({ length: totalLines }, (_, i) => (
            <div key={i} className="h-[22px] px-3 text-[11px] leading-[22px] text-[#57534e]">
              {i + 1}
            </div>
          ))}
          {isStreaming && (
            <div className="h-[22px] px-3 text-[11px] leading-[22px] text-[#9d8bb8]">
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
                  className={`flex h-[22px] items-start ${diffLineStyle(diffType)}`}
                >
                  <span
                    className="whitespace-pre px-4"
                    dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }}
                  />
                </div>
              );
            });
          })}

          {/* Streaming cursor */}
          {isStreaming && (
            <div className="flex h-[22px] items-center px-4">
              <span className="inline-block h-4 w-2 bg-[#9d8bb8] cursor-blink" />
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

/**
 * Diff line styles using aurora palette:
 * - Additions: aurora-mint (#5fb8a3)
 * - Removals: aurora-rose (#c494a4)
 * - Changed: aurora-lavender (#9d8bb8)
 */
function diffLineStyle(type: "added" | "removed" | "changed" | undefined): string {
  switch (type) {
    case "added":
      return "bg-[#5fb8a3]/10 border-l-2 border-l-[#5fb8a3]/60";
    case "removed":
      return "bg-[#c494a4]/8 border-l-2 border-l-[#c494a4]/60 line-through opacity-60";
    case "changed":
      return "bg-[#9d8bb8]/8 border-l-2 border-l-[#9d8bb8]/60";
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
