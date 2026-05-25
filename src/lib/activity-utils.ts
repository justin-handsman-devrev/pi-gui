import type { Message, ToolCallInfo } from "@/stores/agentStore";

export type ActivityFilter = "all" | "edits" | "errors";

export interface ActivityItem {
  id: string;
  toolCall: ToolCallInfo;
  turnIndex: number;
}

const EDIT_TOOLS = new Set(["edit", "write"]);

export function collectActivityItems(messages: Message[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  messages.forEach((message, turnIndex) => {
    if (message.role !== "assistant") return;
    for (const toolCall of message.toolCalls) {
      items.push({
        id: toolCall.toolCallId,
        toolCall,
        turnIndex,
      });
    }
  });

  return items.reverse();
}

export function filterActivityItems(
  items: ActivityItem[],
  filter: ActivityFilter,
): ActivityItem[] {
  if (filter === "all") return items;
  if (filter === "edits") {
    return items.filter((item) => EDIT_TOOLS.has(item.toolCall.toolName));
  }
  return items.filter(
    (item) => item.toolCall.status === "error" || item.toolCall.isError,
  );
}

export function summarizeActivity(items: ActivityItem[]) {
  const edits = items.filter((item) => EDIT_TOOLS.has(item.toolCall.toolName)).length;
  const errors = items.filter(
    (item) => item.toolCall.status === "error" || item.toolCall.isError,
  ).length;
  return { total: items.length, edits, errors };
}

export function extractFilePath(
  toolName: string,
  args: unknown,
): string | null {
  if (toolName === "bash") return null;
  const record = args as { path?: string; file_path?: string } | null | undefined;
  if (!record) return null;
  return record.path ?? record.file_path ?? null;
}

export function extractToolDetail(
  toolCall: ToolCallInfo,
): string | null {
  const args = toolCall.args as Record<string, unknown> | undefined;
  const filePath = extractFilePath(toolCall.toolName, args);
  if (filePath) return filePath;

  if (toolCall.toolName === "bash" && typeof args?.command === "string") {
    const command = args.command.trim();
    return command.length > 72 ? `${command.slice(0, 72)}…` : command;
  }

  if (typeof args?.pattern === "string") return args.pattern;
  if (typeof args?.query === "string") return args.query;

  return null;
}

export function getToolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    bash: "Bash",
    edit: "Edit",
    write: "Write",
    read: "Read",
    grep: "Grep",
    find: "Find",
    ls: "List",
    list: "List",
    list_dir: "List",
  };
  return labels[toolName] ?? toolName;
}

export function canOpenInCanvas(toolCall: ToolCallInfo): boolean {
  return (
    EDIT_TOOLS.has(toolCall.toolName) &&
    !!extractFilePath(toolCall.toolName, toolCall.args)
  );
}
