import { useMemo } from "react";
import hljs from "highlight.js";
import { useCanvasStore } from "@/canvas/canvasStore";
import DiffRenderer from "./DiffRenderer";

/**
 * Read-only code view for the currently active file.
 * Renders syntax-highlighted content with line numbers and optional diff overlay.
 */
export default function CanvasEditor() {
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const file = useCanvasStore((s) =>
    s.activeFilePath ? s.files.get(s.activeFilePath) : undefined,
  );

  if (!activeFilePath || !file) {
    return (
      <div className="flex h-full items-center justify-center bg-dark-bg text-text-muted">
        <p className="text-sm">Select a file to view</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-auto bg-dark-bg font-mono text-sm">
      <FileContent
        content={file.currentContent}
        language={file.language}
        diffs={file.diffs}
        isStreaming={file.isStreaming}
      />
    </div>
  );
}

// ── Internal components ──────────────────────────────────────────────────────

interface FileContentProps {
  content: string;
  language: string | undefined;
  diffs: import("@/canvas/canvasStore").DiffInfo[];
  isStreaming: boolean;
}

function FileContent({ content, language, diffs, isStreaming }: FileContentProps) {
  const lines = useMemo(() => content.split("\n"), [content]);

  const highlightedLines = useMemo(() => {
    if (!content) return lines;
    try {
      let result: string;
      if (language && language !== "plaintext") {
        result = hljs.highlight(content, { language }).value;
      } else {
        result = hljs.highlightAuto(content).value;
      }
      return result.split("\n");
    } catch {
      return lines;
    }
  }, [content, language, lines]);

  const lineCount = highlightedLines.length;

  // Build diff line map: newLineNo → DiffLine[]
  const diffLineMap = useMemo(() => {
    if (diffs.length === 0) return null;
    const map = new Map<number, { type: "added" | "removed"; content: string }[]>();
    for (const diff of diffs) {
      for (const line of diff.parsedLines) {
        if (line.type === "added" && line.newLineNo != null) {
          const arr = map.get(line.newLineNo) ?? [];
          arr.push({ type: "added", content: line.content });
          map.set(line.newLineNo, arr);
        }
      }
    }
    return map;
  }, [diffs]);

  return (
    <div className="flex min-w-full">
      {/* Line numbers */}
      <div className="sticky left-0 shrink-0 select-none bg-dark-bg pr-3 pt-0 text-right font-mono text-xs leading-[20px] text-text-muted">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="h-5 px-2">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Code content */}
      <div className="relative min-w-0 flex-1 overflow-x-auto">
        <pre className="m-0 p-0 leading-[20px]">
          <code className="text-sm">
            {highlightedLines.map((line, i) => {
              const lineNo = i + 1;
              const hasDiff = diffLineMap?.has(lineNo);

              return (
                <div
                  key={i}
                  className={`flex h-5 items-start ${
                    hasDiff
                      ? "border-l-2 border-l-accent-green bg-[#1a3a2a]"
                      : ""
                  }`}
                >
                  <span
                    className="whitespace-pre"
                    dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }}
                  />
                </div>
              );
            })}

            {/* Streaming cursor */}
            {isStreaming && (
              <div className="flex h-5 items-center">
                <span className="inline-block h-4 w-2 bg-accent-blue cursor-blink" />
              </div>
            )}
          </code>
        </pre>

        {/* Diff overlay for added/removed lines */}
        {diffs.length > 0 && (
          <DiffRenderer diffs={diffs} content={content} />
        )}
      </div>
    </div>
  );
}
