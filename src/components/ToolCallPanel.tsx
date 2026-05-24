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
  color: string;
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  bash: {
    icon: <Terminal size={14} />,
    label: "Bash",
    color: "text-[#d4a88c]",
  },
  edit: {
    icon: <FileEdit size={14} />,
    label: "Edit",
    color: "text-[#9d8bb8]",
  },
  write: {
    icon: <FilePenLine size={14} />,
    label: "Write",
    color: "text-[#5fb8a3]",
  },
  read: {
    icon: <BookOpen size={14} />,
    label: "Read",
    color: "text-[#a8a29e]",
  },
  grep: {
    icon: <Search size={14} />,
    label: "Grep",
    color: "text-[#9d8bb8]",
  },
  find: {
    icon: <FolderSearch size={14} />,
    label: "Find",
    color: "text-[#9d8bb8]",
  },
  ls: {
    icon: <List size={14} />,
    label: "List",
    color: "text-[#a8a29e]",
  },
};

const DEFAULT_CONFIG: ToolConfig = {
  icon: <Wrench size={14} />,
  label: "Tool",
  color: "text-[#a8a29e]",
};

// ── Status indicator ─────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: ToolCallInfo["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 size={13} className="animate-spin text-[#d4a88c]" />;
    case "completed":
      return (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5fb8a3]/15">
          <Check size={11} className="text-[#5fb8a3]" />
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
    <div className="overflow-hidden rounded-xl bg-[#131210] border border-[rgba(255,255,255,0.06)] text-[15px] transition-colors duration-150">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-150 hover:bg-[#1c1917]"
      >
        {/* Tool name badge */}
        <span className={`flex items-center gap-1.5 text-[13px] ${config.color}`}>
          {config.icon}
          <span className="text-[#fafaf9]">{config.label}</span>
        </span>

        {/* File path or command */}
        {filePath && (
          <span className="flex items-center gap-1 truncate text-[13px] text-[#a8a29e]">
            <FileCode size={12} className="shrink-0 text-[#57534e]" />
            <span className="truncate font-mono">{filePath}</span>
          </span>
        )}
        {toolCall.toolName === "bash" &&
          typeof args?.command === "string" && (
            <span className="truncate font-mono text-[13px] text-[#78716c]">
              $ {String(args.command)}
            </span>
          )}

        <span className="flex-1" />

        {/* Status */}
        <StatusIndicator status={toolCall.status} />

        {/* Expand toggle */}
        <span className="text-[#57534e]">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
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
            <div className="border-t border-[rgba(255,255,255,0.06)] px-3 py-2.5 font-mono text-[13px] text-[#a8a29e] space-y-2">
              {/* Edit: replacement count */}
              {toolCall.toolName === "edit" && (() => {
                const edits = args?.edits;
                if (Array.isArray(edits)) {
                  return (
                    <div className="text-[#57534e]">
                      {edits.length} replacement{edits.length !== 1 ? "s" : ""}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Write: content length */}
              {toolCall.toolName === "write" &&
                typeof args?.content === "string" && (
                  <div className="text-[#57534e]">
                    {args.content.length.toLocaleString()} chars
                  </div>
                )}

              {/* Bash: full command */}
              {toolCall.toolName === "bash" &&
                typeof args?.command === "string" && (
                  <div className="rounded bg-[#1c1917] px-2 py-1.5 text-[13px]">
                    <span className="text-[#d4a88c]">$</span>{" "}
                    <span className="text-[#fafaf9]">
                      {String(args.command)}
                    </span>
                  </div>
                )}

              {/* Output / result */}
              {outputText && (
                <div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#1c1917] p-2.5 text-[13px] text-[#a8a29e]">
                    {displayOutput}
                  </pre>
                  {isOutputLong && (
                    <button
                      type="button"
                      onClick={() => setShowFullOutput((s) => !s)}
                      className="mt-1 text-[11px] text-[#9d8bb8] transition-colors duration-150 hover:text-[#b8a8c8]"
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
                    className="text-[11px] text-[#57534e] transition-colors duration-150 hover:text-[#78716c]"
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
                        className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#1c1917] p-2.5 text-[11px] text-[#57534e]"
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1c1917] px-3 py-1.5 text-[13px] text-[#9d8bb8] transition-colors duration-150 hover:bg-[#262220]"
                >
                  <FileCode size={12} />
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
