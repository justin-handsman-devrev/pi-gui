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
 *
 * ElevenLabs-inspired design: warm dark ink colors, pill-shaped toggles,
 * refined aurora accent palette.
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
  const filename = activeFile ? activeFile.filePath.split("/").pop() : "";

  // ── Collapsed bar ────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center gap-3 border-l border-[rgba(255,255,255,0.06)] bg-[#131210] py-4">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="rounded-lg p-2 text-[#78716c] transition-colors duration-150 hover:bg-[#44403c]/30 hover:text-[#a8a29e]"
          aria-label="Expand canvas"
          data-tooltip="Expand Canvas"
        >
          <Eye size={16} />
        </button>

        {/* Mini file indicator */}
        {activeFile && (
          <div className="flex flex-col items-center gap-1">
            <div className="h-8 w-0.5 rounded-full bg-[#9d8bb8]/50" />
            <span className="max-w-[40px] truncate text-center text-[9px] text-[#57534e] [writing-mode:vertical-rl]">
              {filename}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── Full pane ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#131210]">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#131210] px-3">
        {/* Left: text-label + filename */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-[11px] font-semibold tracking-[0.88px] text-[#78716c] uppercase">
            Canvas
          </span>
          {activeFile && filename && (
            <>
              <span className="text-[#57534e]">·</span>
              <span
                className="truncate text-[13px] text-[#a8a29e]"
                title={activeFile.filePath}
              >
                {filename}
              </span>
            </>
          )}
        </div>

        {/* Center: pill toggle */}
        {hasFiles && (
          <div className="flex items-center gap-0.5 rounded-full bg-[#1c1917] p-0.5">
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

        {/* Right: ghost icon buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1.5 text-[#78716c] transition-colors duration-150 hover:bg-[#44403c]/30 hover:text-[#a8a29e]"
            aria-label="Minimize canvas"
          >
            <EyeOff size={14} />
          </button>
          <button
            type="button"
            onClick={() => setCanvasVisible(false)}
            className="rounded-lg p-1.5 text-[#78716c] transition-colors duration-150 hover:bg-[#44403c]/30 hover:text-[#a8a29e]"
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
        flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-150
        ${
          active
            ? "bg-[#292524] text-[#fafaf9]"
            : "text-[#78716c] hover:text-[#a8a29e]"
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
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1c1917]">
        <Code2 size={24} className="text-[#57534e]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#a8a29e]">
          No files open
        </p>
        <p className="mt-1 text-xs text-[#78716c]">
          Files will appear here as the agent edits them
        </p>
      </div>
    </div>
  );
}
