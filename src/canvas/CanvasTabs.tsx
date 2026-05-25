import { useRef, useCallback } from "react";
import {
  FileCode2, FileJson, FileType, Braces, Hash, Terminal, Folder, X,
} from "lucide-react";
import { useCanvasStore } from "@/canvas/canvasStore";
import { basename } from "@/lib/path-utils";

function FileIcon({ language }: { language: string | undefined }) {
  const p = { size: 13, style: { flexShrink: 0 } };
  switch (language) {
    case "typescript": case "javascript": return <Braces {...p} />;
    case "json":       return <FileJson {...p} />;
    case "python": case "ruby": case "perl": return <Hash {...p} />;
    case "css": case "scss": case "less": return <FileCode2 {...p} />;
    case "markdown":   return <FileType {...p} />;
    case "bash": case "shell": return <Terminal {...p} />;
    default:           return <Folder {...p} />;
  }
}

export default function CanvasTabs() {
  const tabOrder       = useCanvasStore((s) => s.tabOrder);
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const files          = useCanvasStore((s) => s.files);
  const setActiveFile  = useCanvasStore((s) => s.setActiveFile);
  const closeFile      = useCanvasStore((s) => s.closeFile);
  const scrollRef      = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent, fp: string) => { e.stopPropagation(); closeFile(fp); },
    [closeFile],
  );

  if (tabOrder.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      role="tablist"
      aria-label="Open files"
      className="canvas-tabs-bar"
    >
      {tabOrder.map((fp) => {
        const active      = fp === activeFilePath;
        const file        = files.get(fp);
        const isStreaming = file?.isStreaming ?? false;
        const name        = basename(fp);

        return (
          <button
            key={fp}
            role="tab"
            aria-selected={active}
            title={fp}
            onClick={() => setActiveFile(fp)}
            className="group relative flex shrink-0 items-center gap-1.5 px-2.5 py-1 whitespace-nowrap transition-all duration-150"
            style={{
              fontSize: 13,
              fontFamily: "var(--font-sans)",
              fontWeight: active ? 500 : 400,
              color: active ? "var(--ink)" : "var(--muted)",
              background: active ? "var(--surface-strong)" : "transparent",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--r-md)",
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = "var(--canvas)";
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span style={{ color: active ? "var(--body-strong)" : "var(--muted-soft)" }}>
              <FileIcon language={file?.language} />
            </span>

            {isStreaming && (
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ background: "var(--primary)" }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--primary)" }} />
              </span>
            )}

            <span className="max-w-[140px] truncate">{name}</span>

            <span
              role="button"
              tabIndex={0}
              aria-label={`Close ${name}`}
              onClick={(e) => handleClose(e, fp)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClose(e, fp); }}
              className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 transition-all duration-150 group-hover:opacity-100"
              style={{ color: "var(--muted-soft)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--hairline)";
                (e.currentTarget as HTMLElement).style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--muted-soft)";
              }}
            >
              <X size={11} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
