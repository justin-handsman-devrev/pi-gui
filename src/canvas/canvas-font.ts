export const CANVAS_FONT_MIN = 10;
export const CANVAS_FONT_MAX = 24;
export const CANVAS_FONT_DEFAULT = 13;

export function clampCanvasFontSize(size: number): number {
  return Math.max(CANVAS_FONT_MIN, Math.min(CANVAS_FONT_MAX, Math.round(size)));
}

export function canvasLineHeight(fontSize: number): number {
  return Math.round(fontSize * (22 / 13));
}

export const CANVAS_MONO =
  "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace";
