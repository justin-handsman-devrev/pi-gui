// ── Types ────────────────────────────────────────────────────────────────────

export interface DiffLine {
  type: "added" | "removed" | "context";
  oldLineNo?: number;
  newLineNo?: number;
  content: string;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface DiffFile {
  /** The original file path (from `--- a/path`). */
  oldPath?: string;
  /** The new file path (from `+++ b/path`). */
  newPath?: string;
  hunks: DiffHunk[];
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a unified diff string into structured lines (all hunks flattened).
 *
 * Handles standard unified diff format:
 *   `@@ -a,b +c,d @@` hunk headers
 *   `+` added lines
 *   `-` removed lines
 *   ` ` context lines
 *
 * It silently skips `\ No newline at end of file` markers and any lines
 * that don't match the expected format.
 */
export function parseUnifiedDiff(diff: string): DiffLine[] {
  const files = parseUnifiedDiffFiles(diff);
  const lines: DiffLine[] = [];
  for (const file of files) {
    for (const hunk of file.hunks) {
      lines.push(...hunk.lines);
    }
  }
  return lines;
}

/**
 * Parse a unified diff into per-file structures, each containing hunks.
 */
export function parseUnifiedDiffFiles(diff: string): DiffFile[] {
  const rawLines = diff.split("\n");
  const files: DiffFile[] = [];
  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const raw of rawLines) {
    // ── File headers ────────────────────────────────────────────────────────
    if (raw.startsWith("--- ")) {
      currentFile = { oldPath: stripFilePrefix(raw.slice(4)), hunks: [] };
      files.push(currentFile);
      currentHunk = null;
      continue;
    }

    if (raw.startsWith("+++ ")) {
      if (currentFile) {
        currentFile.newPath = stripFilePrefix(raw.slice(4));
      }
      continue;
    }

    // ── Hunk header ─────────────────────────────────────────────────────────
    const hunkMatch = raw.match(
      /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/,
    );
    if (hunkMatch) {
      oldLine = parseInt(hunkMatch[1], 10);
      const oldCount = hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1;
      newLine = parseInt(hunkMatch[3], 10);
      const newCount = hunkMatch[4] !== undefined ? parseInt(hunkMatch[4], 10) : 1;

      currentHunk = {
        header: raw,
        oldStart: oldLine,
        oldCount,
        newStart: newLine,
        newCount,
        lines: [],
      };

      // If we haven't seen a `--- ` line yet, create a synthetic file entry
      if (!currentFile) {
        currentFile = { hunks: [] };
        files.push(currentFile);
      }
      currentFile.hunks.push(currentHunk);
      continue;
    }

    // ── Diff lines (only within a hunk) ─────────────────────────────────────
    if (!currentHunk) continue;

    // Skip "no newline" markers
    if (raw.startsWith("\\ ")) continue;

    if (raw.startsWith("+")) {
      currentHunk.lines.push({
        type: "added",
        newLineNo: newLine,
        content: raw.slice(1),
      });
      newLine++;
    } else if (raw.startsWith("-")) {
      currentHunk.lines.push({
        type: "removed",
        oldLineNo: oldLine,
        content: raw.slice(1),
      });
      oldLine++;
    } else if (raw.startsWith(" ") || raw === "") {
      // An empty string within a hunk represents a context line with no
      // leading space (some diffs omit the trailing space on blank lines).
      currentHunk.lines.push({
        type: "context",
        oldLineNo: oldLine,
        newLineNo: newLine,
        content: raw.startsWith(" ") ? raw.slice(1) : raw,
      });
      oldLine++;
      newLine++;
    }
    // Any other line inside a hunk is ignored (e.g. binary patch data).
  }

  return files;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip `a/` or `b/` prefix from file paths in diff headers. */
function stripFilePrefix(path: string): string {
  const trimmed = path.trimEnd();
  if (trimmed.startsWith("a/") || trimmed.startsWith("b/")) {
    return trimmed.slice(2);
  }
  // Handle /dev/null
  if (trimmed === "/dev/null") return "/dev/null";
  return trimmed;
}
