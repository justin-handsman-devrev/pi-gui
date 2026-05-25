import type { Message, ToolCallInfo } from "@/stores/agentStore";
import type { SessionRecord } from "@/stores/sessionHistoryStore";
import { parseAssistantContent } from "@/lib/assistant-content";

type AgentMessage = Record<string, unknown>;
type ContentBlock = Record<string, unknown>;

function extractToolCalls(content: unknown): ToolCallInfo[] {
  if (!Array.isArray(content)) return [];

  const toolCalls: ToolCallInfo[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const record = block as ContentBlock;
    const type = record.type;
    if (type !== "toolCall" && type !== "tool_call") continue;

    const toolCallId = (
      record.toolCallId ?? record.tool_call_id ?? record.id ?? `tool-${toolCalls.length}`
    ) as string;
    const toolName = (record.toolName ?? record.tool_name ?? record.name ?? "tool") as string;
    const isError = record.isError === true || record.is_error === true;
    const hasResult = record.result !== undefined && record.result !== null;

    toolCalls.push({
      toolCallId,
      toolName,
      args: record.args,
      result: record.result,
      isError,
      status: isError ? "error" : hasResult ? "completed" : "completed",
    });
  }

  return toolCalls;
}

function mapAssistantMessage(msg: AgentMessage, index: number): Message | null {
  const contentBlocks = msg.content;
  const toolCalls = extractToolCalls(contentBlocks);
  const parsed = parseAssistantContent(
    Array.isArray(contentBlocks) ? contentBlocks as ContentBlock[] : undefined,
    toolCalls.length > 0,
  );

  const responseText = parsed.response;
  const hasContent = Boolean(
    responseText || parsed.thinking || parsed.preamble || toolCalls.length > 0,
  );
  if (!hasContent) return null;

  const id = typeof msg.id === "string" ? msg.id : `hist-asst-${index}`;

  return {
    id,
    role: "assistant",
    content: responseText,
    thinking: parsed.thinking,
    preamble: parsed.preamble || undefined,
    toolCalls,
    isStreaming: false,
  };
}

function extractUserText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .filter((block): block is ContentBlock => typeof block === "object" && block !== null)
    .filter((block) => block.type === "text")
    .map((block) => (typeof block.text === "string" ? block.text : ""))
    .join("");
}

/**
 * Convert pi RPC `get_messages` payloads into UI message bubbles.
 */
export function mapAgentMessages(raw: unknown): Message[] {
  if (!raw || typeof raw !== "object") return [];

  const messages = (raw as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return [];

  const mapped: Message[] = [];

  for (const item of messages) {
    if (!item || typeof item !== "object") continue;
    const msg = item as AgentMessage;
    const role = msg.role;

    if (role === "user") {
      const content = extractUserText(msg.content);
      if (!content.trim()) continue;
      mapped.push({
        id: typeof msg.id === "string" ? msg.id : `hist-user-${mapped.length}`,
        role: "user",
        content,
        toolCalls: [],
        isStreaming: false,
      });
      continue;
    }

    if (role === "assistant") {
      const assistant = mapAssistantMessage(msg, mapped.length);
      if (assistant) mapped.push(assistant);
    }
  }

  return mapped;
}

export function mapCachedSessionMessages(
  messages: SessionRecord["messages"],
): Message[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    thinking: m.thinking ?? null,
    preamble: m.preamble,
    toolCalls: m.toolCalls ?? [],
    isStreaming: false,
  }));
}
