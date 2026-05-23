import { useCanvasStore } from "@/canvas/canvasStore";
import { basename } from "@/lib/path-utils";

/**
 * Horizontal file tab bar for the canvas pane.
 */
export default function CanvasTabs() {
  const tabOrder = useCanvasStore((s) => s.tabOrder);
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const files = useCanvasStore((s) => s.files);
  const setActiveFile = useCanvasStore((s) => s.setActiveFile);
  const removeFile = useCanvasStore((s) => s.removeFile);

  if (tabOrder.length === 0) return null;

  return (
    <div
      className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-dark-border bg-dark-bg"
      role="tablist"
    >
      {tabOrder.map((filePath) => {
        const isActive = filePath === activeFilePath;
        const file = files.get(filePath);
        const isStreaming = file?.isStreaming ?? false;

        return (
          <button
            key={filePath}
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveFile(filePath)}
            className={`
              group relative flex h-full shrink-0 items-center gap-1.5 px-3
              text-xs font-medium transition-colors
              ${
                isActive
                  ? "bg-dark-elevated text-text-primary"
                  : "bg-dark-bg text-text-secondary hover:bg-dark-elevated hover:text-text-primary"
              }
            `}
          >
            {/* Active tab bottom border */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />
            )}

            {/* Streaming indicator */}
            {isStreaming && (
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue pulse-dot" />
            )}

            {/* Filename */}
            <span className="max-w-[140px] truncate">
              {basename(filePath)}
            </span>

            {/* Close button */}
            <span
              role="button"
              tabIndex={0}
              aria-label={`Close ${basename(filePath)}`}
              onClick={(e) => {
                e.stopPropagation();
                removeFile(filePath);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  removeFile(filePath);
                }
              }}
              className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-text-muted opacity-0 transition-opacity hover:bg-dark-border hover:text-text-primary group-hover:opacity-100"
            >
              ×
            </span>
          </button>
        );
      })}
    </div>
  );
}
