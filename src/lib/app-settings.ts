import type { SettingsState } from "@/stores/uiStore";

export const SETTINGS_STORAGE_KEY = "pi-gui-settings";

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 20;
export const FONT_SIZE_DEFAULT = 15;

export const APP_ZOOM_MIN = 75;
export const APP_ZOOM_MAX = 150;
export const APP_ZOOM_STEP = 5;
export const APP_ZOOM_DEFAULT = 100;

const defaultSettings: SettingsState = {
  theme: "dark",
  fontSize: FONT_SIZE_DEFAULT,
  appZoom: APP_ZOOM_DEFAULT,
  canvasFontSize: 13,
  showLineNumbers: true,
  canvasAutoOpen: true,
  compactMessages: false,
};

export function clampFontSize(value: number): number {
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(value)));
}

export function clampAppZoom(value: number): number {
  const stepped = Math.round(value / APP_ZOOM_STEP) * APP_ZOOM_STEP;
  return Math.min(APP_ZOOM_MAX, Math.max(APP_ZOOM_MIN, stepped));
}

export function loadSettings(): SettingsState {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) return { ...defaultSettings };

  try {
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      ...defaultSettings,
      ...parsed,
      fontSize: clampFontSize(parsed.fontSize ?? FONT_SIZE_DEFAULT),
      appZoom: clampAppZoom(parsed.appZoom ?? APP_ZOOM_DEFAULT),
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function applySettings(settings: SettingsState): void {
  const root = document.documentElement;

  root.setAttribute("data-theme", settings.theme);
  root.style.setProperty("--chat-font-size", `${settings.fontSize}px`);
  root.style.setProperty("--app-zoom", String(settings.appZoom / 100));

  if (settings.compactMessages) {
    root.setAttribute("data-compact-messages", "true");
  } else {
    root.removeAttribute("data-compact-messages");
  }
}

export function applyTheme(theme: "dark" | "light"): void {
  document.documentElement.setAttribute("data-theme", theme);
}
