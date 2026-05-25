import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  FileCode,
  FileText,
  Image,
  Loader2,
} from "lucide-react";
import { readTextFile } from "@/lib/tauri-commands";
import { loadDirectoryChildren } from "@/lib/init-file-tree";
import { useFileTreeStore, type FileNode } from "@/stores/fileTreeStore";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/canvas/canvasStore";
import { canvasLineHeight } from "@/canvas/canvas-font";

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const codeExts = ["ts", "tsx", "js", "jsx", "py", "rs", "go", "rb", "java", "c", "cpp", "h"];
  const textExts = ["md", "txt", "json", "yaml", "yml", "toml", "xml", "csv"];
  const imgExts = ["png", "jpg", "jpeg", "gif", "svg", "webp"];

  if (codeExts.includes(ext)) return <FileCode size={13} style={{ color: "var(--accent-code)" }} />;
  if (textExts.includes(ext)) return <FileText size={13} style={{ color: "var(--accent-mint)" }} />;
  if (imgExts.includes(ext)) return <Image size={13} style={{ color: "var(--warning)" }} />;
  return <File size={13} style={{ color: "var(--muted-soft)" }} />;
}

function FileTreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const canvasFontSize = useUIStore((s) => s.settings.canvasFontSize);
  const lineHeight = canvasLineHeight(canvasFontSize);
  const [children, setChildren] = useState<FileNode[] | null>(node.children ?? null);
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const [loading, setLoading] = useState(false);
  const selectedPath = useFileTreeStore((s) => s.selectedPath);
  const setSelectedPath = useFileTreeStore((s) => s.setSelectedPath);
  const openFile = useCanvasStore((s) => s.openFile);
  const setActiveFile = useCanvasStore((s) => s.setActiveFile);

  const isSelected = selectedPath === node.path;

  const handleClick = useCallback(async () => {
    if (node.isDirectory) {
      const nextExpanded = !expanded;
      setExpanded(nextExpanded);

      if (nextExpanded && !children) {
        setLoading(true);
        try {
          const loaded = await loadDirectoryChildren(node.path);
          setChildren(loaded);
        } catch {
          setChildren([]);
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    setSelectedPath(node.path);
    setLoading(true);
    try {
      const content = await readTextFile(node.path);
      openFile(node.path, content);
      setActiveFile(node.path);
    } catch (err) {
      console.error("[CanvasFileExplorer] read failed:", err);
    } finally {
      setLoading(false);
    }
  }, [
    node,
    expanded,
    children,
    setSelectedPath,
    openFile,
    setActiveFile,
  ]);

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`canvas-explorer-row ${isSelected ? "is-selected" : ""}`}
        style={{ paddingLeft: depth * 10 + 6, fontSize: canvasFontSize, lineHeight: `${lineHeight}px` }}
      >
        {node.isDirectory ? (
          <span className="canvas-explorer-chevron">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span className="canvas-explorer-chevron" />
        )}

        {node.isDirectory ? (
          <Folder size={13} style={{ color: "var(--warning)", flexShrink: 0 }} />
        ) : (
          getFileIcon(node.name)
        )}

        <span className="truncate">{node.name}</span>

        {loading && (
          <Loader2 size={11} className="animate-spin ml-auto shrink-0" style={{ color: "var(--muted-soft)" }} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CanvasFileExplorer() {
  const tree = useFileTreeStore((s) => s.tree);
  const rootPath = useFileTreeStore((s) => s.rootPath);
  const canvasFontSize = useUIStore((s) => s.settings.canvasFontSize);

  if (!rootPath) {
    return (
      <div className="canvas-explorer-empty" style={{ fontSize: canvasFontSize }}>
        <p>No project loaded</p>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="canvas-explorer-empty" style={{ fontSize: canvasFontSize }}>
        <p className="truncate" title={rootPath}>{rootPath}</p>
        <p style={{ marginTop: 4, fontSize: Math.max(10, canvasFontSize - 2) }}>Empty directory</p>
      </div>
    );
  }

  return (
    <div className="canvas-explorer-scroll">
      {tree.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}
