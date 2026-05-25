/** CSI sequences with or without the leading ESC (pi sometimes strips ESC). */
const ANSI_ESCAPE =
  /\u001b(?:\][^\u0007]*(?:\u0007|\u001b\\)|[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

const ORPHANED_CSI = /\[(?:\d+(?:;\d+)*)?[A-Za-z]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE, "").replace(ORPHANED_CSI, "");
}

export function sanitizeThinkingText(text: string): string {
  const withoutAnsi = stripAnsi(text).trim();
  const withoutLabel = withoutAnsi.replace(/^Thinking:\s*/i, "");

  return withoutLabel
    .split("\n")
    .map((line) => line.replace(/^Thinking:\s*/i, "").trimEnd())
    .join("\n")
    .trim();
}
