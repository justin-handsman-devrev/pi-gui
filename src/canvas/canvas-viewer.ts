import { getLanguageFromPath } from "@/lib/language-detect";

export type CanvasViewerKind =
  | "markdown"
  | "html"
  | "image"
  | "json"
  | "svg"
  | "plain";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico"]);

export function getViewerKind(
  filePath: string,
  language?: string,
): CanvasViewerKind {
  const lang = language ?? getLanguageFromPath(filePath);
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";

  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (ext === "svg" || lang === "xml" && ext === "svg") return "svg";
  if (lang === "markdown" || ext === "md" || ext === "markdown") return "markdown";
  if (lang === "xml" && (ext === "html" || ext === "htm")) return "html";
  if (lang === "json" || ext === "json") return "json";

  return "plain";
}

export function viewerSupportsFile(filePath: string, language?: string): boolean {
  const kind = getViewerKind(filePath, language);
  return kind !== "plain";
}

export function viewerKindLabel(kind: CanvasViewerKind): string {
  switch (kind) {
    case "markdown":
      return "Markdown";
    case "html":
      return "HTML";
    case "image":
      return "Image";
    case "json":
      return "JSON";
    case "svg":
      return "SVG";
    default:
      return "Text";
  }
}

export function formatJsonContent(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
