/**
 * Friendly, short display name for a model id.
 *
 * Handles common id shapes:
 *   "us.anthropic.claude-opus-4-7"     → "Claude Opus 4-7"
 *   "anthropic/claude-opus-4-20250514"  → "Claude Opus 4"
 *   "openai:gpt-4o-mini"                → "Gpt 4o Mini"
 *   "claude-3-5-sonnet"                 → "Claude 3 5 Sonnet"
 */
export function shortModelName(id: string): string {
  if (!id) return "";
  // 1. Strip path-like / namespaced prefixes (slash, colon, dot) — keep last segment.
  let s = id;
  for (const sep of ["/", ":"]) {
    const i = s.lastIndexOf(sep);
    if (i >= 0) s = s.slice(i + 1);
  }
  // For dotted ids (Bedrock-style), keep only the last dot-segment.
  if (s.includes(".")) s = s.split(".").pop()!;
  // 2. Drop trailing -YYYYMMDD date stamps.
  s = s.replace(/-\d{8}$/, "");
  // 3. Title-case hyphen tokens, keep numerics intact.
  return s
    .split("-")
    .map((t) => (t.length === 0 ? t : t.charAt(0).toUpperCase() + t.slice(1)))
    .join(" ");
}

/** Compact form for tight slots (status bar, prompt badge). Caps length. */
export function compactModelName(id: string, max = 22): string {
  const s = shortModelName(id);
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

/** Full model id for display — keeps path segment, strips date suffix, no length cap. */
export function fullModelName(id: string): string {
  if (!id) return "";
  let s = id;
  for (const sep of ["/", ":"]) {
    const i = s.lastIndexOf(sep);
    if (i >= 0) s = s.slice(i + 1);
  }
  if (s.includes(".")) s = s.split(".").pop()!;
  return s.replace(/-\d{8}$/, "");
}

export function fullModelLabel(provider: string, id: string): string {
  const name = fullModelName(id);
  if (!provider || name.includes("/") || name.includes(":")) return name;
  return `${provider}/${name}`;
}
