import { useState } from "react";
import { X, Code2, GitCompareArrows, Eye, EyeOff } from "lucide-react";
import { useCanvasStore } from "@/canvas/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import CanvasTabs from "@/canvas/CanvasTabs";
import CanvasEditor from "@/canvas/CanvasEditor";
import DiffRenderer from "@/canvas/DiffRenderer";

/**
 * CanvasPane — the right-side panel that shows live file edits/writes
 * streaming in from the agent, with syntax highlighting and diff view.
 */
export default function CanvasPane() {
  const tabOrder = useCanvasStore((s) => s.tabOrder);
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const files = useCanvasStore((s) => s.files);
  const viewMode = useCanvasStore((s) => s.viewMode);
  const setViewMode = useCanvasStore((s) => s.setViewMode);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);

  const [collapsed, setCollapsed] = useState(false);

  const hasFiles = tabOrder.length > 0;
  const activeFile = activeFilePath ? files.get(activeFilePath) : undefined;

  // ── Collapsed bar ────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-[var(--bg-surface)] pt-4">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="rounded-md p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          aria-label="Expand canvas"
          data-tooltip="Expand Canvas"
        >
          <Eye size={18} />
        </button>
        {activeFile && (
          <span className="max-w-[60px] truncate text-center text-[10px] text-[var(--text-faint)]">
            {activeFile.filePath.split("/").pop()}
          </span>
        )}
      </div>
    );
  }

  // ── Full pane ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3">
        {/* Left: title + file path */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
            Canvas
          </span>
          {activeFile && (
            <>
              <span className="text-[var(--text-faint)]">·</span>
              <span
                className="truncate text-xs text-[var(--text-muted)]"
                title={activeFile.filePath}
              >
                {activeFile.filePath}
              </span>
            </>
          )}
        </div>

        {/* Center: view toggle */}
        {hasFiles && (
          <div className="flex items-center gap-0.5 rounded-md bg-[var(--bg-elevated)] p-0.5">
            <ViewToggleBtn
              active={viewMode === "code"}
              onClick={() => setViewMode("code")}
              icon={<Code2 size={13} />}
              label="Code"
            />
            <ViewToggleBtn
              active={viewMode === "diff"}
              onClick={() => setViewMode("diff")}
              icon={<GitCompareArrows size={13} />}
              label="Diff"
            />
          </div>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
            aria-label="Minimize canvas"
          >
            <EyeOff size={14} />
          </button>
          <button
            type="button"
            onClick={() => setCanvasVisible(false)}
            className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
            aria-label="Close canvas"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {hasFiles && <CanvasTabs />}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!hasFiles ? (
          <EmptyState />
        ) : viewMode === "diff" && activeFile && activeFile.diffs.length > 0 ? (
          <DiffRenderer diffs={activeFile.diffs} filePath={activeFile.filePath} />
        ) : (
          <CanvasEditor />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ViewToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-all
        ${
          active
            ? "bg-[var(--accent-muted)] text-[var(--accent-primary)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-elevated)]">
        <Code2 size={24} className="text-[var(--text-faint)]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No files open
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Files will appear here as the agent edits them
        </p>
      </div>
    </div>
  );
}
