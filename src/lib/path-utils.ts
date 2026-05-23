/**
 * Minimal path utilities — avoids importing Node path in browser.
 */

export function basename(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || parts[parts.length - 2] || filePath;
}
