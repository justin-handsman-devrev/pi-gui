import { useState, useEffect, type ReactNode } from "react";
import { X, FileText, Eye, GitCompareArrows, FolderTree, Code2, GitBranch } from "lucide-react";
import { useCanvasStore } from "@/canvas/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import { viewerSupportsFile } from "@/canvas/canvas-viewer";
import CanvasTabs from "@/canvas/CanvasTabs";
import CanvasEditor from "@/canvas/CanvasEditor";
import CanvasViewer from "@/canvas/CanvasViewer";
import CanvasFileExplorer from "@/canvas/CanvasFileExplorer";
import CanvasFontControls from "@/canvas/CanvasFontControls";
import CanvasGitPanel from "@/canvas/CanvasGitPanel";
import DiffRenderer from "@/canvas/DiffRenderer";

export default function CanvasPane() {
  const tabOrder = useCanvasStore((s) => s.tabOrder);
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const files = useCanvasStore((s) => s.files);
  const viewMode = useCanvasStore((s) => s.viewMode);
  const panelMode = useCanvasStore((s) => s.panelMode);
  const setViewMode = useCanvasStore((s) => s.setViewMode);
  const setPanelMode = useCanvasStore((s) => s.setPanelMode);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);
  const [showExplorer, setShowExplorer] = useState(true);

  const hasFiles = tabOrder.length > 0;
  const activeFile = activeFilePath ? files.get(activeFilePath) : undefined;
  const projectName = getActiveProjectCwd().split("/").filter(Boolean).pop() ?? "Project";
  const canPreview = activeFile
    ? viewerSupportsFile(activeFile.filePath, activeFile.language)
    : false;
  const showDiff = Boolean(activeFile && activeFile.diffs.length > 0);
  const showFontControls = hasFiles && viewMode === "text";

  useEffect(() => {
    if (viewMode === "viewer" && activeFile && !canPreview) {
      setViewMode("text");
    }
    if (viewMode === "diff" && activeFile && !showDiff) {
      setViewMode("text");
    }
  }, [viewMode, activeFile, canPreview, showDiff, setViewMode]);

  return (
    <div className="el-canvas-pane flex h-full flex-col overflow-hidden">
      <div className="canvas-header">
        <div className="canvas-header-start">
          <span className="canvas-header-label">Canvas</span>
        </div>

        <div className="canvas-header-actions">
          <div className="canvas-toolbar-group">
            <PanelToggle
              active={panelMode === "files"}
              onClick={() => setPanelMode("files")}
              icon={<Code2 size={12} />}
              label="Files"
            />
            <PanelToggle
              active={panelMode === "git"}
              onClick={() => setPanelMode("git")}
              icon={<GitBranch size={12} />}
              label="Git"
            />
          </div>

          {panelMode === "files" && showFontControls && <CanvasFontControls />}

          {panelMode === "files" && (
            <button
              type="button"
              onClick={() => setShowExplorer((v) => !v)}
              className={`canvas-header-btn ${showExplorer ? "is-active" : ""}`}
              title={showExplorer ? "Hide file explorer" : "Show file explorer"}
              aria-pressed={showExplorer}
            >
              <FolderTree size={13} />
            </button>
          )}

          {panelMode === "files" && hasFiles && activeFile && (
            <div className="canvas-toolbar-group">
              <ViewToggle
                active={viewMode === "text"}
                onClick={() => setViewMode("text")}
                icon={<FileText size={12} />}
                label="Text"
              />
              <ViewToggle
                active={viewMode === "viewer"}
                onClick={() => setViewMode("viewer")}
                icon={<Eye size={12} />}
                label="Viewer"
                disabled={!canPreview}
                title={canPreview ? "Rendered preview" : "No preview for this file type"}
              />
              {showDiff && (
                <ViewToggle
                  active={viewMode === "diff"}
                  onClick={() => setViewMode("diff")}
                  icon={<GitCompareArrows size={12} />}
                  label="Diff"
                />
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setCanvasVisible(false)}
            className="canvas-header-btn"
            title="Hide canvas panel"
            aria-label="Hide canvas panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {panelMode === "git" ? (
          <CanvasGitPanel />
        ) : (
          <>
            {showExplorer && (
              <aside className="canvas-explorer">
                <div className="canvas-explorer-header">
                  <span className="truncate" title={getActiveProjectCwd()}>
                    {projectName}
                  </span>
                </div>
                <CanvasFileExplorer />
              </aside>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              {hasFiles && <CanvasTabs />}

              <div className="min-h-0 flex-1 overflow-hidden">
                {!hasFiles ? (
                  <CanvasEmpty showExplorer={showExplorer} />
                ) : viewMode === "diff" && activeFile && activeFile.diffs.length > 0 ? (
                  <DiffRenderer diffs={activeFile.diffs} filePath={activeFile.filePath} />
                ) : viewMode === "viewer" && canPreview ? (
                  <CanvasViewer />
                ) : (
                  <CanvasEditor />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PanelToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`canvas-view-toggle${active ? " is-active" : ""}`}
    >
      {icon}
      <span className="canvas-view-toggle-label">{label}</span>
    </button>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
  disabled = false,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={`canvas-view-toggle${active ? " is-active" : ""}`}
    >
      {icon}
      <span className="canvas-view-toggle-label">{label}</span>
    </button>
  );
}

function CanvasEmpty({ showExplorer }: { showExplorer: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-8 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center"
        style={{
          background: "var(--surface-strong)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--r-lg)",
        }}
      >
        <Code2 size={20} style={{ color: "var(--muted-soft)" }} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--body-strong)" }}>
          {showExplorer ? "Pick a file to preview" : "No files open"}
        </p>
        <p className="mt-1.5" style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
          {showExplorer
            ? "Browse the project tree, then use Text to edit or Viewer to preview supported files."
            : "Open the file explorer or let the agent edit files to populate the canvas."}
        </p>
      </div>
    </div>
  );
}
