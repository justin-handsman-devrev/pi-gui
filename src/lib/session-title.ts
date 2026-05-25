const MAX_TITLE_LENGTH = 52;

const GENERIC_TITLE_PATTERNS = [
  /^untitled(\s+chat)?$/i,
  /^new session$/i,
  /^new chat$/i,
  /^chat \d+$/i,
  /^[0-9a-f]{8}$/i,
];

export function isGenericSessionTitle(name: string | undefined): boolean {
  if (!name?.trim()) return true;
  const normalized = name.trim();
  return GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function stripMarkdownForTitle(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[Attached file: [^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateTitle(text: string): string {
  if (text.length <= MAX_TITLE_LENGTH) return text;
  const slice = text.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > 20) return `${slice.slice(0, lastSpace)}…`;
  return `${slice.trimEnd()}…`;
}

/** Derive a short display title from the first user message. */
export function generateSessionTitleFromMessage(text: string): string | null {
  const withoutAttachments = text.split(/\n\n\[Attached file:/)[0] ?? "";
  const firstLine = withoutAttachments.split("\n")[0]?.trim() ?? "";
  const cleaned = stripMarkdownForTitle(firstLine || withoutAttachments);

  if (cleaned) {
    return truncateTitle(cleaned);
  }

  const fileMatch = text.match(/\[Attached file: ([^\]]+)\]/);
  if (fileMatch?.[1]) {
    return truncateTitle(fileMatch[1]);
  }

  return null;
}

export function resolveSessionName(options: {
  sessionName?: string;
  existingName?: string;
  titleLocked?: boolean;
  messages: Array<{ role: string; content: string }>;
}): string {
  const agentName = options.sessionName?.trim();

  if (agentName && !isGenericSessionTitle(agentName)) {
    return agentName;
  }

  if (options.titleLocked && options.existingName?.trim()) {
    return options.existingName.trim();
  }

  const firstUser = options.messages.find((m) => m.role === "user");
  if (firstUser?.content) {
    const generated = generateSessionTitleFromMessage(firstUser.content);
    if (generated) return generated;
  }

  if (options.existingName && !isGenericSessionTitle(options.existingName)) {
    return options.existingName;
  }

  return agentName || options.existingName?.trim() || "Untitled chat";
}
