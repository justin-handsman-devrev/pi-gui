import { sanitizeThinkingText } from "./sanitize-thinking";

export interface ParsedAssistantContent {
  thinking: string | null;
  /** Text that appears before tool calls in the turn. Hidden once tools are shown. */
  preamble: string;
  /** Final assistant response text after tool calls complete. */
  response: string;
}

function joinText(parts: string[]): string {
  return parts.join("").trim();
}

/**
 * Split assistant message content blocks into thinking, pre-tool text, and post-tool response.
 * Mirrors pi's content array ordering: text/thinking blocks, toolCall blocks, then more text.
 */
export function parseAssistantContent(
  content: Array<Record<string, unknown>> | undefined,
  hasToolCalls = false,
): ParsedAssistantContent {
  if (!content || !Array.isArray(content)) {
    return { thinking: null, preamble: "", response: "" };
  }

  let lastToolIndex = -1;
  for (let i = 0; i < content.length; i++) {
    if (content[i].type === "toolCall") {
      lastToolIndex = i;
    }
  }

  const thinkingParts: string[] = [];
  const beforeToolParts: string[] = [];
  const afterToolParts: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const block = content[i];
    if (block.type === "thinking" && typeof block.thinking === "string") {
      thinkingParts.push(block.thinking);
      continue;
    }
    if (block.type !== "text" || typeof block.text !== "string") {
      continue;
    }

    if (lastToolIndex === -1) {
      beforeToolParts.push(block.text);
    } else if (i < lastToolIndex) {
      beforeToolParts.push(block.text);
    } else if (i > lastToolIndex) {
      afterToolParts.push(block.text);
    }
  }

  const rawThinking = joinText(thinkingParts);
  const thinking = rawThinking ? sanitizeThinkingText(rawThinking) : null;

  if (lastToolIndex === -1) {
    const allText = joinText(beforeToolParts);
    if (hasToolCalls) {
      return { thinking, preamble: allText, response: "" };
    }
    return { thinking, preamble: "", response: allText };
  }

  return {
    thinking,
    preamble: joinText(beforeToolParts),
    response: joinText(afterToolParts),
  };
}
