import { useState } from "react";
import type { ToolCallInfo } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";

interface Props {
  toolCall: ToolCallInfo;
}

const TOOL_ICONS: Record<string, string> = {
  bash: "⚡",
  edit: "✏️",
  write: "📝",
  read: "📖",
  grep: "🔍",
  find: "📁",
  ls: "📋",
};

const STATUS_ICONS: Record<ToolCallInfo["status"], React.ReactNode> = {
  running: (
    <svg
      className="h-3.5 w-3.5 animate-spin text-[#d29922]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  ),
  completed: <span className="text-[#3fb950]">✓</span>,
  error: <span className="text-[#f85149]">✗</span>,
};

export default function ToolCallPanel({ toolCall }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [showFullOutput, setShowFullOutput] = useState(false);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);

  const icon = TOOL_ICONS[toolCall.toolName] ?? "🔧";
  const statusIcon = STATUS_ICONS[toolCall.toolName === toolCall.toolName ? toolCall.status : toolCall.status];
  const args = toolCall.args as Record<string, unknown> | undefined;

  const filePath = extractFilePath(toolCall.toolName, args);
  const isFileTool = ["edit", "write", "read"].includes(toolCall.toolName);

  const outputText = extractOutput(toolCall);
  const isOutputLong = outputText.length > 500;
  const displayOutput =
    !showFullOutput && isOutputLong
      ? outputText.slice(0, 500) + "…"
      : outputText;

  return (
    <div className="my-1 rounded border border-[#21262d] bg-[#161b22] overflow-hidden text-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[#8b949e] hover:bg-[#21262d] transition-colors"
      >
        <span className="text-xs">{icon}</span>
        <span className="font-medium text-[#e6edf3]">{toolCall.toolName}</span>
        {filePath && (
          <span className="truncate text-[#58a6ff] text-xs">{filePath}</span>
        )}
        <span className="ml-auto flex-shrink-0">{statusIcon}</span>
        <span className="text-[#484f58] text-xs">
          {collapsed ? "▸" : "▾"}
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="border-t border-[#21262d] px-3 py-2 text-xs text-[#8b949e] font-mono space-y-2">
          {/* Bash: command */}
          {toolCall.toolName === "bash" && args?.command && (
            <div>
              <span className="text-[#484f58]">$</span>{" "}
              <span className="text-[#e6edf3]">{String(args.command)}</span>
            </div>
          )}

          {/* Edit: replacements count */}
          {toolCall.toolName === "edit" && (
            <div>
              {args?.replacements != null && (
                <span>{String(args.replacements)} replacement(s)</span>
              )}
            </div>
          )}

          {/* Write: content length */}
          {toolCall.toolName === "write" && args?.content && (
            <div>
              {String(args.content).length.toLocaleString()} chars
            </div>
          )}

          {/* Output / result */}
          {outputText && (
            <div>
              <pre className="whitespace-pre-wrap break-all max-h-64 overflow-auto rounded bg-[#0d1117] p-2 text-[#8b949e]">
                {displayOutput}
              </pre>
              {isOutputLong && (
                <button
                  type="button"
                  onClick={() => setShowFullOutput((s) => !s)}
                  className="mt-1 text-[#58a6ff] hover:underline"
                >
                  {showFullOutput ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          {/* View in Canvas button for file tools */}
          {isFileTool && filePath && (
            <button
              type="button"
              onClick={() => setCanvasVisible(true)}
              className="flex items-center gap-1 rounded bg-[#21262d] px-2 py-1 text-[#58a6ff] hover:bg-[#30363d] transition-colors"
            >
              <span>📄</span>
              <span>View in Canvas</span>
            </button>
          )}
        </div>
      )}
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
