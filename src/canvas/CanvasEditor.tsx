import { useCallback, useEffect, useMemo, useRef } from "react";
import hljs from "highlight.js";
import { writeTextFile } from "@/lib/tauri-commands";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore, type DiffInfo } from "@/canvas/canvasStore";
import { CANVAS_MONO, canvasLineHeight } from "@/canvas/canvas-font";

export default function CanvasEditor() {
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const file = useCanvasStore((s) =>
    s.activeFilePath ? s.files.get(s.activeFilePath) : undefined,
  );
  const updateFileContent = useCanvasStore((s) => s.updateFileContent);
  const markFileSaved = useCanvasStore((s) => s.markFileSaved);
  const canvasFontSize = useUIStore((s) => s.settings.canvasFontSize);
  const showLineNumbers = useUIStore((s) => s.settings.showLineNumbers);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleSave = useCallback(async () => {
    if (!activeFilePath || !file) return;
    if (file.currentContent === file.savedContent) return;

    try {
      await writeTextFile(activeFilePath, file.currentContent);
      markFileSaved(activeFilePath);
      addNotification({
        type: "success",
        title: "Saved",
        message: activeFilePath.split("/").pop() ?? activeFilePath,
      });
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Save failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [activeFilePath, file, markFileSaved, addNotification]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "s") return;
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") return;
      if (!target.closest(".canvas-editor")) return;
      e.preventDefault();
      void handleSave();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  if (!activeFilePath || !file) {
    return (
      <div
        className="flex h-full items-center justify-center py-8"
        style={{ background: "var(--canvas-deep)", color: "var(--muted)" }}
      >
        <p className="text-sm">Select a file to view</p>
      </div>
    );
  }

  const isDirty = file.currentContent !== file.savedContent;
  const lineHeight = canvasLineHeight(canvasFontSize);
  const diffLineTypes =
    file.diffs.length > 0 ? buildDiffLineSet(file.diffs) : null;

  if (file.isStreaming) {
    return (
      <ReadOnlyCodeView
        content={file.currentContent}
        language={file.language}
        isStreaming
        fontSize={canvasFontSize}
        lineHeight={lineHeight}
        diffLineTypes={diffLineTypes}
        showLineNumbers={showLineNumbers}
      />
    );
  }

  return (
    <EditableCodeView
      content={file.currentContent}
      fontSize={canvasFontSize}
      lineHeight={lineHeight}
      isDirty={isDirty}
      showLineNumbers={showLineNumbers}
      onChange={(value) => updateFileContent(activeFilePath, value)}
      onSave={handleSave}
    />
  );
}

interface EditableCodeViewProps {
  content: string;
  fontSize: number;
  lineHeight: number;
  isDirty: boolean;
  showLineNumbers: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}

function EditableCodeView({
  content,
  fontSize,
  lineHeight,
  isDirty,
  showLineNumbers,
  onChange,
  onSave,
}: EditableCodeViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => content.split("\n"), [content]);
  const lineCount = Math.max(lines.length, 1);
  const gutterWidth = Math.max(3, String(lineCount).length) * 8 + 24;

  const syncScroll = useCallback(() => {
    if (!textareaRef.current || !gutterRef.current) return;
    gutterRef.current.scrollTop = textareaRef.current.scrollTop;
  }, []);

  return (
    <div className="canvas-editor flex h-full flex-col overflow-hidden" style={{ background: "var(--canvas-deep)" }}>
      <div className="canvas-editor-toolbar">
        <span style={{ fontSize: 10, color: isDirty ? "var(--warning)" : "var(--muted-soft)" }}>
          {isDirty ? "Unsaved changes" : "Editable · ⌘S to save"}
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty}
          className="canvas-save-btn"
        >
          Save
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {showLineNumbers && (
        <div
          ref={gutterRef}
          className="shrink-0 overflow-hidden select-none text-right"
          style={{
            width: gutterWidth,
            borderRight: "1px solid var(--dark-hairline, var(--hairline))",
            background: "var(--canvas-deep)",
          }}
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              style={{
                height: lineHeight,
                padding: "0 12px",
                fontSize: Math.max(10, fontSize - 2),
                lineHeight: `${lineHeight}px`,
                color: "var(--muted-soft)",
                fontFamily: CANVAS_MONO,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="canvas-editor-input min-h-0 flex-1 resize-none border-0 bg-transparent p-0 outline-none"
          style={{
            padding: "0 16px",
            fontSize,
            lineHeight: `${lineHeight}px`,
            fontFamily: CANVAS_MONO,
            color: "var(--on-dark, var(--ink))",
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}

interface ReadOnlyCodeViewProps {
  content: string;
  language: string | undefined;
  isStreaming: boolean;
  fontSize: number;
  lineHeight: number;
  diffLineTypes: Map<number, "added" | "removed" | "changed"> | null;
  showLineNumbers: boolean;
}

function ReadOnlyCodeView({
  content,
  language,
  isStreaming,
  fontSize,
  lineHeight,
  diffLineTypes,
  showLineNumbers,
}: ReadOnlyCodeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => content.split("\n"), [content]);

  const highlighted = useMemo(() => {
    if (lines.length === 0) {
      return [{ html: "", startLine: 1, lineCount: 1 }];
    }
    if (lines.length <= 2000) {
      const html = highlightContent(content, language);
      const htmlLines = html.split("\n");
      while (htmlLines.length < lines.length) htmlLines.push("");
      return [{ html: htmlLines.join("\n"), startLine: 1, lineCount: htmlLines.length }];
    }

    const batchSize = 500;
    const blocks: { html: string; startLine: number; lineCount: number }[] = [];
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize).join("\n");
      blocks.push({
        html: highlightContent(batch, language),
        startLine: i + 1,
        lineCount: Math.min(batchSize, lines.length - i),
      });
    }
    return blocks;
  }, [content, language, lines]);

  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isStreaming, content]);

  const totalLines = lines.length;
  const gutterWidth = Math.max(3, String(Math.max(totalLines, 1)).length) * 8 + 24;

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto" style={{ background: "var(--canvas-deep)" }}>
      <pre
        className="m-0 flex min-w-full"
        style={{
          fontFamily: CANVAS_MONO,
          fontSize,
          lineHeight: `${lineHeight}px`,
        }}
      >
        <div
          className="sticky left-0 z-10 shrink-0 select-none text-right"
          style={{
            width: showLineNumbers ? gutterWidth : 0,
            borderRight: showLineNumbers ? "1px solid var(--dark-hairline, var(--hairline))" : "none",
            background: "var(--canvas-deep)",
            overflow: "hidden",
          }}
          aria-hidden="true"
        >
          {showLineNumbers && Array.from({ length: Math.max(totalLines, 1) }, (_, i) => (
            <div
              key={i}
              style={{
                height: lineHeight,
                padding: "0 12px",
                fontSize: Math.max(10, fontSize - 2),
                lineHeight: `${lineHeight}px`,
                color: "var(--muted-soft)",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <code className="min-w-0 flex-1 p-0">
          {highlighted.map((block) => {
            const htmlLines = block.html.split("\n");
            return htmlLines.map((lineHtml, j) => {
              const lineNo = block.startLine + j;
              const diffType = diffLineTypes?.get(lineNo);

              return (
                <div
                  key={`${block.startLine}-${j}`}
                  className={`flex items-start ${diffLineStyle(diffType)}`}
                  style={{
                    height: lineHeight,
                    background:
                      diffType === "added"
                        ? "color-mix(in srgb, var(--accent-mint) 10%, transparent)"
                        : diffType === "removed"
                          ? "color-mix(in srgb, var(--accent-rose) 8%, transparent)"
                          : diffType === "changed"
                            ? "color-mix(in srgb, var(--accent-lavender) 8%, transparent)"
                            : undefined,
                  }}
                >
                  <span
                    className="whitespace-pre px-4"
                    dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }}
                  />
                </div>
              );
            });
          })}

          {isStreaming && (
            <div className="flex items-center px-4" style={{ height: lineHeight }}>
              <span
                className="inline-block h-4 w-2 cursor-blink"
                style={{ background: "var(--accent-lavender)" }}
              />
            </div>
          )}
        </code>
      </pre>
    </div>
  );
}

function highlightContent(code: string, language: string | undefined): string {
  if (!code) return "";
  try {
    if (language && language !== "plaintext") {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

function diffLineStyle(type: "added" | "removed" | "changed" | undefined): string {
  switch (type) {
    case "added":
    case "removed":
      return "border-l-2 line-through opacity-60";
    case "changed":
      return "border-l-2";
    default:
      return "";
  }
}

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
        if (!map.has(line.oldLineNo)) {
          map.set(line.oldLineNo, "removed");
        }
      }
    }
  }

  return map;
}
