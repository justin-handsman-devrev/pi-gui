import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  X,
  Terminal,
  FileEdit,
  FilePenLine,
  BookOpen,
  Search,
  FolderSearch,
  List,
  Wrench,
  FileCode,
} from "lucide-react";
import type { ToolCallInfo } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/canvas/canvasStore";

// ── Tool config ──────────────────────────────────────────────────────────

interface ToolConfig {
  icon: ReactNode;
  label: string;
  color: string; // tailwind text color
  bg: string; // tailwind bg color
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  bash: {
    icon: <Terminal size={12} />,
    label: "Bash",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  edit: {
    icon: <FileEdit size={12} />,
    label: "Edit",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  write: {
    icon: <FilePenLine size={12} />,
    label: "Write",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  read: {
    icon: <BookOpen size={12} />,
    label: "Read",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
  grep: {
    icon: <Search size={12} />,
    label: "Grep",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  find: {
    icon: <FolderSearch size={12} />,
    label: "Find",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  ls: {
    icon: <List size={12} />,
    label: "List",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
};

const DEFAULT_CONFIG: ToolConfig = {
  icon: <Wrench size={12} />,
  label: "Tool",
  color: "text-zinc-400",
  bg: "bg-zinc-500/10",
};

// ── Status indicator ─────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: ToolCallInfo["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 size={13} className="animate-spin text-amber-400" />;
    case "completed":
      return (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15">
          <Check size={11} className="text-emerald-400" />
        </span>
      );
    case "error":
      return (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/15">
          <X size={11} className="text-red-400" />
        </span>
      );
  }
}

// ── Main Component ───────────────────────────────────────────────────────

interface Props {
  toolCall: ToolCallInfo;
}

export default function ToolCallPanel({ toolCall }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [showFullOutput, setShowFullOutput] = useState(false);
  const [showArgs, setShowArgs] = useState(false);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);
  const setActiveFile = useCanvasStore((s) => s.setActiveFile);

  const config = TOOL_CONFIGS[toolCall.toolName] ?? DEFAULT_CONFIG;
  const args = toolCall.args as Record<string, unknown> | undefined;
  const filePath = extractFilePath(toolCall.toolName, args);
  const canViewInCanvas = ["edit", "write"].includes(toolCall.toolName) && !!filePath;

  const outputText = extractOutput(toolCall);
  const isOutputLong = outputText.length > 500;
  const displayOutput =
    !showFullOutput && isOutputLong
      ? outputText.slice(0, 500) + "…"
      : outputText;

  const handleViewInCanvas = () => {
    if (!filePath) return;
    setCanvasVisible(true);
    setActiveFile(filePath);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 text-sm transition-colors duration-150">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-150 hover:bg-zinc-800/60"
      >
        {/* Tool name badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${config.color} ${config.bg}`}
        >
          {config.icon}
          {config.label}
        </span>

        {/* File path or command */}
        {filePath && (
          <span className="flex items-center gap-1 truncate text-xs text-zinc-400">
            <FileCode size={11} className="shrink-0 text-zinc-500" />
            <span className="truncate font-mono">{filePath}</span>
          </span>
        )}
        {toolCall.toolName === "bash" &&
          typeof args?.command === "string" && (
            <span className="truncate font-mono text-xs text-zinc-400">
              $ {String(args.command)}
            </span>
          )}

        <span className="flex-1" />

        {/* Status */}
        <StatusIndicator status={toolCall.status} />

        {/* Expand toggle */}
        <span className="text-zinc-600">
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-800 px-3 py-2.5 font-mono text-xs text-zinc-400 space-y-2">
              {/* Edit: replacement count */}
              {toolCall.toolName === "edit" && (() => {
                const edits = args?.edits;
                if (Array.isArray(edits)) {
                  return (
                    <div className="text-zinc-500">
                      {edits.length} replacement{edits.length !== 1 ? "s" : ""}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Write: content length */}
              {toolCall.toolName === "write" &&
                typeof args?.content === "string" && (
                  <div className="text-zinc-500">
                    {args.content.length.toLocaleString()} chars
                  </div>
                )}

              {/* Bash: full command */}
              {toolCall.toolName === "bash" &&
                typeof args?.command === "string" && (
                  <div className="rounded bg-zinc-800/60 px-2 py-1.5 text-xs">
                    <span className="text-amber-400">$</span>{" "}
                    <span className="text-zinc-200">
                      {String(args.command)}
                    </span>
                  </div>
                )}

              {/* Output / result */}
              {outputText && (
                <div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md bg-zinc-800/60 p-2.5 text-xs text-zinc-400">
                    {displayOutput}
                  </pre>
                  {isOutputLong && (
                    <button
                      type="button"
                      onClick={() => setShowFullOutput((s) => !s)}
                      className="mt-1 text-[11px] text-violet-400 transition-colors duration-150 hover:text-violet-300"
                    >
                      {showFullOutput ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}

              {/* Args JSON viewer */}
              {args && Object.keys(args).length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowArgs((s) => !s)}
                    className="text-[11px] text-zinc-500 transition-colors duration-150 hover:text-zinc-400"
                  >
                    {showArgs ? "Hide args" : "Show args"}
                  </button>
                  <AnimatePresence>
                    {showArgs && (
                      <motion.pre
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-zinc-800/60 p-2.5 text-[11px] text-zinc-500"
                      >
                        {JSON.stringify(args, null, 2)}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* View in Canvas button */}
              {canViewInCanvas && (
                <button
                  type="button"
                  onClick={handleViewInCanvas}
                  className="inline-flex items-center gap-1.5 rounded-md bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-400 transition-colors duration-150 hover:bg-violet-500/20"
                >
                  <FileCode size={11} />
                  View in Canvas
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function extractFilePath(
  toolName: string,
  args?: Record<string, unknown>,
): string | null {
  if (!args) return null;
  if (toolName === "bash") return null;
  return (args.path as string) ?? (args.file_path as string) ?? null;
}

function extractOutput(tc: ToolCallInfo): string {
  if (tc.partialResult != null) return stringify(tc.partialResult);
  if (tc.result != null) return stringify(tc.result);
  return "";
}

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
