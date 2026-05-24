import { useRef, useCallback } from "react";
import {
  FileCode2,
  FileJson,
  FileType,
  Braces,
  Hash,
  Terminal,
  Folder,
} from "lucide-react";
import { useCanvasStore } from "@/canvas/canvasStore";
import { basename } from "@/lib/path-utils";

/**
 * Horizontal file tab bar for the canvas pane.
 * Shows streaming indicators and file-type icons.
 */

// ── File icon by language ────────────────────────────────────────────────────

function FileIcon({ language }: { language: string | undefined }) {
  const props = { size: 13, className: "shrink-0" };

  switch (language) {
    case "typescript":
    case "javascript":
      return <Braces {...props} />;
    case "json":
      return <FileJson {...props} />;
    case "python":
    case "ruby":
    case "perl":
      return <Hash {...props} />;
    case "css":
    case "scss":
    case "less":
      return <FileCode2 {...props} />;
    case "markdown":
      return <FileType {...props} />;
    case "bash":
    case "shell":
      return <Terminal {...props} />;
    case "xml":
    case "html":
      return <FileCode2 {...props} />;
    default:
      return <Folder {...props} />;
  }
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CanvasTabs() {
  const tabOrder = useCanvasStore((s) => s.tabOrder);
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const files = useCanvasStore((s) => s.files);
  const setActiveFile = useCanvasStore((s) => s.setActiveFile);
  const closeFile = useCanvasStore((s) => s.closeFile);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent, filePath: string) => {
      e.stopPropagation();
      closeFile(filePath);
    },
    [closeFile],
  );

  if (tabOrder.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]"
      role="tablist"
      aria-label="Open files"
    >
      {tabOrder.map((filePath) => {
        const isActive = filePath === activeFilePath;
        const file = files.get(filePath);
        const isStreaming = file?.isStreaming ?? false;
        const fileName = basename(filePath);

        return (
          <button
            key={filePath}
            role="tab"
            aria-selected={isActive}
            title={filePath}
            onClick={() => setActiveFile(filePath)}
            className={`
              group relative flex h-full shrink-0 items-center gap-1.5 border-b-2
              px-3 text-xs font-medium transition-colors
              ${
                isActive
                  ? "border-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
              }
            `}
          >
            {/* File type icon */}
            <FileIcon language={file?.language} />

            {/* Streaming indicator */}
            {isStreaming && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-primary)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
              </span>
            )}

            {/* Filename */}
            <span className="max-w-[140px] truncate">{fileName}</span>

            {/* Close button — visible on hover */}
            <span
              role="button"
              tabIndex={0}
              aria-label={`Close ${fileName}`}
              onClick={(e) => handleClose(e, filePath)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleClose(e, filePath);
                }
              }}
              className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded
                text-[var(--text-faint)] opacity-0 transition-all
                hover:bg-[var(--bg-active)] hover:text-[var(--text-secondary)]
                group-hover:opacity-100"
            >
              ×
            </span>
          </button>
        );
      })}
    </div>
  );
}
