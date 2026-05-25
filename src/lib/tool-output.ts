export interface ParsedToolOutput {
  kind: "empty" | "text" | "file-list" | "grep-matches" | "bash" | "json";
  text: string;
  files?: string[];
  lines?: string[];
}

interface ContentBlock {
  type?: string;
  text?: string;
}

function isContentBlock(value: unknown): value is ContentBlock {
  return typeof value === "object" && value !== null;
}

/** Pull human-readable text from pi tool result payloads. */
export function extractToolResultText(value: unknown): string {
  if (value == null) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return extractToolResultText(JSON.parse(trimmed));
      } catch {
        return value;
      }
    }
    return value;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.content)) {
      return record.content
        .filter(isContentBlock)
        .filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text as string)
        .join("\n")
        .trim();
    }

    if (typeof record.output === "string") return record.output;
    if (typeof record.stdout === "string") return record.stdout;
    if (typeof record.text === "string") return record.text;
    if (typeof record.message === "string") return record.message;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const LIST_TOOLS = new Set(["ls", "list", "list_dir", "glob"]);
const SEARCH_TOOLS = new Set(["grep", "find", "rg", "search", "Glob"]);

function outputCountLabel(toolName: string, count: number): string {
  if (toolName === "read") {
    return count === 1 ? "line" : "lines";
  }
  if (SEARCH_TOOLS.has(toolName)) {
    return count === 1 ? "match" : "matches";
  }
  if (LIST_TOOLS.has(toolName)) {
    return count === 1 ? "entry" : "entries";
  }
  return count === 1 ? "result" : "results";
}

export function parseToolOutput(toolName: string, value: unknown): ParsedToolOutput {
  const text = extractToolResultText(value);
  if (!text) return { kind: "empty", text: "" };

  if (LIST_TOOLS.has(toolName)) {
    const files = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (files.length > 0) {
      return { kind: "file-list", text, files };
    }
  }

  if (SEARCH_TOOLS.has(toolName)) {
    const lines = text.split("\n").filter((line) => line.trim());
    return { kind: "grep-matches", text, lines };
  }

  if (toolName === "bash") {
    return { kind: "bash", text };
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.content) && text) {
      return { kind: "text", text };
    }
    if (text && text !== JSON.stringify(value, null, 2)) {
      return { kind: "text", text };
    }
    return { kind: "json", text: JSON.stringify(value, null, 2) };
  }

  return { kind: "text", text };
}

export function countToolOutput(toolName: string, value: unknown): number | null {
  const parsed = parseToolOutput(toolName, value);
  if (parsed.kind === "file-list" && parsed.files) return parsed.files.length;
  if (parsed.kind === "grep-matches" && parsed.lines) return parsed.lines.length;
  if (parsed.kind === "text" || parsed.kind === "bash") {
    const lines = parsed.text.split("\n").filter((line) => line.trim());
    return lines.length > 0 ? lines.length : null;
  }
  return null;
}

export function getOutputCountLabel(toolName: string, count: number): string {
  return outputCountLabel(toolName, count);
}

export interface ToolArgChip {
  key: string;
  value: string;
}

const HIDDEN_ARG_KEYS = new Set(["edits", "content", "old_string", "new_string"]);

export function formatToolArgs(args: Record<string, unknown> | undefined): ToolArgChip[] {
  if (!args) return [];

  const chips: ToolArgChip[] = [];

  for (const [key, raw] of Object.entries(args)) {
    if (HIDDEN_ARG_KEYS.has(key)) continue;
    if (raw == null || raw === "") continue;

    if (typeof raw === "string") {
      chips.push({ key, value: raw });
      continue;
    }

    if (typeof raw === "number" || typeof raw === "boolean") {
      chips.push({ key, value: String(raw) });
    }
  }

  return chips;
}
