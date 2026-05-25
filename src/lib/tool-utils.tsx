import type { ReactNode } from "react";
import {
  BookOpen,
  FileEdit,
  FilePenLine,
  FolderSearch,
  List,
  Search,
  Terminal,
  Wrench,
} from "lucide-react";
import type { ToolCallInfo } from "@/stores/agentStore";
import { extractToolDetail } from "@/lib/activity-utils";
import { countToolOutput, extractToolResultText, getOutputCountLabel } from "@/lib/tool-output";

export interface ToolVisual {
  icon: ReactNode;
  label: string;
  tone: "mint" | "code" | "success" | "warning" | "slate" | "lavender";
}

const ICON_SIZE = 12;
const ICON_STROKE = 2;

export const TOOL_VISUALS: Record<string, ToolVisual> = {
  bash:  { icon: <Terminal size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "Bash",  tone: "warning" },
  edit:  { icon: <FileEdit size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "Edit",  tone: "code" },
  write: { icon: <FilePenLine size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "Write", tone: "success" },
  read:  { icon: <BookOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "Read",  tone: "mint" },
  grep:  { icon: <Search size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "Grep",  tone: "lavender" },
  find:  { icon: <FolderSearch size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "Find", tone: "lavender" },
  ls:        { icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "List",  tone: "slate" },
  list:      { icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "List",  tone: "slate" },
  list_dir:  { icon: <List size={ICON_SIZE} strokeWidth={ICON_STROKE} />, label: "List",  tone: "slate" },
};

export const DEFAULT_TOOL_VISUAL: ToolVisual = {
  icon: <Wrench size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  label: "Tool",
  tone: "slate",
};

export function getToolVisual(toolName: string): ToolVisual {
  return TOOL_VISUALS[toolName] ?? { ...DEFAULT_TOOL_VISUAL, label: toolName };
}

export function summarizeToolCalls(toolCalls: ToolCallInfo[]) {
  const running = toolCalls.filter((tc) => tc.status === "running").length;
  const errors = toolCalls.filter((tc) => tc.status === "error" || tc.isError).length;
  return { total: toolCalls.length, running, errors };
}

export function getToolSummaryLine(toolCall: ToolCallInfo): string {
  const detail = extractToolDetail(toolCall);
  const result = toolCall.partialResult ?? toolCall.result;
  const count = toolCall.status !== "running" ? countToolOutput(toolCall.toolName, result) : null;

  if (detail && count != null) {
    return `${detail} · ${count} ${getOutputCountLabel(toolCall.toolName, count)}`;
  }

  if (detail) return detail;

  const args = toolCall.args as Record<string, unknown> | undefined;
  if (toolCall.toolName === "edit" && Array.isArray(args?.edits)) {
    const editCount = args.edits.length;
    return `${editCount} replacement${editCount !== 1 ? "s" : ""}`;
  }
  if (toolCall.toolName === "write" && typeof args?.content === "string") {
    return `${args.content.length.toLocaleString()} chars`;
  }

  if (count != null) {
    return `${count} ${count === 1 ? "result" : "results"}`;
  }

  return toolCall.status === "running" ? "Running…" : "Completed";
}

export function extractToolOutput(toolCall: ToolCallInfo): string {
  return extractToolResultText(toolCall.partialResult ?? toolCall.result);
}

export function extractToolFilePath(
  toolName: string,
  args?: Record<string, unknown>,
): string | null {
  if (!args || toolName === "bash") return null;
  return (args.path as string) ?? (args.file_path as string) ?? null;
}
