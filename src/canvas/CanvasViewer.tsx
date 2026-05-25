import { useEffect, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye } from "lucide-react";
import { useCanvasStore } from "@/canvas/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import {
  formatJsonContent,
  getViewerKind,
  viewerKindLabel,
  viewerSupportsFile,
} from "@/canvas/canvas-viewer";

const markdownComponents = {
  pre({ children }: { children?: ReactNode }) {
    return <pre className="canvas-viewer-code-block">{children}</pre>;
  },
  code({ className, children }: { className?: string; children?: ReactNode }) {
    const isBlock = typeof children === "string" && children.includes("\n");
    if (isBlock || className) {
      return <code className={className}>{children}</code>;
    }
    return <code className="canvas-viewer-inline-code">{children}</code>;
  },
};

async function resolveAssetUrl(path: string): Promise<string | null> {
  try {
    const { convertFileSrc } = await import("@tauri-apps/api/core");
    return convertFileSrc(path);
  } catch {
    return null;
  }
}

export default function CanvasViewer() {
  const activeFilePath = useCanvasStore((s) => s.activeFilePath);
  const file = useCanvasStore((s) =>
    s.activeFilePath ? s.files.get(s.activeFilePath) : undefined,
  );
  const canvasFontSize = useUIStore((s) => s.settings.canvasFontSize);

  if (!file || !activeFilePath) {
    return (
      <div className="canvas-viewer-empty">
        <p>Select a file to preview</p>
      </div>
    );
  }

  if (!viewerSupportsFile(file.filePath, file.language)) {
    return (
      <div className="canvas-viewer-empty">
        <Eye size={20} style={{ color: "var(--muted-soft)" }} />
        <p>No rendered preview for this file type</p>
        <p className="canvas-viewer-empty-hint">Switch to Text to view and edit the source.</p>
      </div>
    );
  }

  const kind = getViewerKind(file.filePath, file.language);
  const content = file.currentContent;

  return (
    <div className="canvas-viewer">
      <div className="canvas-viewer-toolbar">
        <Eye size={12} style={{ color: "var(--muted-soft)" }} />
        <span>{viewerKindLabel(kind)} preview</span>
      </div>

      <div
        className="canvas-viewer-body"
        style={{ fontSize: canvasFontSize }}
      >
        {kind === "markdown" && (
          <div className="canvas-viewer-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        {kind === "html" && (
          <iframe
            className="canvas-viewer-iframe"
            title={`Preview ${file.filePath}`}
            sandbox=""
            srcDoc={content}
          />
        )}

        {(kind === "image" || kind === "svg") && (
          <AssetImage path={activeFilePath} alt={file.filePath.split("/").pop() ?? "Preview"} />
        )}

        {kind === "json" && (
          <pre className="canvas-viewer-json">
            <code>{formatJsonContent(content)}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function AssetImage({ path, alt }: { path: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setSrc(null);

    void resolveAssetUrl(path).then((url) => {
      if (cancelled) return;
      if (url) {
        setSrc(url);
      } else {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (failed || !src) {
    return (
      <div className="canvas-viewer-empty">
        <p>{failed ? "Could not load image preview" : "Loading preview…"}</p>
      </div>
    );
  }

  return (
    <div className="canvas-viewer-image-wrap">
      <img src={src} alt={alt} className="canvas-viewer-image" />
    </div>
  );
}
