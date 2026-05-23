/**
 * Parse a unified diff string into structured DiffLine objects.
 *
 * Each line in the diff is classified as added (+), removed (-), or context
 * (space). Line numbers for old and new sides are tracked automatically.
 */

export interface DiffLine {
  type: "added" | "removed" | "context";
  oldLineNo?: number;
  newLineNo?: number;
  content: string;
}

export function parseUnifiedDiff(diff: string): DiffLine[] {
  const lines = diff.split("\n");
  const result: DiffLine[] = [];

  let oldLine = 0;
  let newLine = 0;

  for (const raw of lines) {
    // Parse hunk headers like @@ -1,4 +1,5 @@
    const hunkMatch = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[2], 10);
      continue;
    }

    // Skip non-diff lines (headers like --- a/file, +++ b/file, etc.)
    if (
      raw.startsWith("---") ||
      raw.startsWith("+++") ||
      raw.startsWith("diff ") ||
      raw.startsWith("index ") ||
      raw.length === 0
    ) {
      continue;
    }

    if (raw.startsWith("+")) {
      result.push({
        type: "added",
        newLineNo: newLine,
        content: raw.slice(1),
      });
      newLine++;
    } else if (raw.startsWith("-")) {
      result.push({
        type: "removed",
        oldLineNo: oldLine,
        content: raw.slice(1),
      });
      oldLine++;
    } else if (raw.startsWith(" ")) {
      result.push({
        type: "context",
        oldLineNo: oldLine,
        newLineNo: newLine,
        content: raw.slice(1),
      });
      oldLine++;
      newLine++;
    }
  }

  return result;
}
