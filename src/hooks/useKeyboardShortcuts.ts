import { useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";

export interface ShortcutDef {
  key: string;
  label: string;
  description: string;
  action: () => void;
  when?: () => boolean;
}

/**
 * Global keyboard shortcuts hook.
 * Registers shortcuts and returns the shortcut definitions for the help overlay.
 */
export function useKeyboardShortcuts() {
  const toggleSidebar   = useUIStore((s) => s.toggleSidebar);
  const canvasVisible   = useUIStore((s) => s.canvasVisible);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const settingsOpen    = useUIStore((s) => s.settingsOpen);

  const handleNewSession = useCallback(() => {
    window.dispatchEvent(new CustomEvent("pi:new-session"));
  }, []);

  const handleCommandPalette = useCallback(() => {
    window.dispatchEvent(new CustomEvent("pi:command-palette"));
  }, []);

  const handleToggleShortcuts = useCallback(() => {
    window.dispatchEvent(new CustomEvent("pi:toggle-shortcuts"));
  }, []);

  const shortcuts: ShortcutDef[] = [
    {
      key: "mod+n",
      label: "⌘N",
      description: "New session",
      action: handleNewSession,
    },
    {
      key: "mod+k",
      label: "⌘K",
      description: "Command palette",
      action: handleCommandPalette,
    },
    {
      key: "mod+b",
      label: "⌘B",
      description: "Toggle sidebar",
      action: toggleSidebar,
    },
    {
      key: "mod+shift+c",
      label: "⇧⌘C",
      description: "Toggle canvas",
      action: () => setCanvasVisible(!canvasVisible),
    },
    {
      key: "escape",
      label: "Esc",
      description: "Close overlay / abort",
      action: () => {
        if (settingsOpen) setSettingsOpen(false);
        window.dispatchEvent(new CustomEvent("pi:escape"));
      },
    },
    {
      key: "mod+,",
      label: "⌘,",
      description: "Open settings",
      action: () => setSettingsOpen(true),
    },
    {
      key: "mod+/",
      label: "⌘/",
      description: "Keyboard shortcuts",
      action: handleToggleShortcuts,
    },
    {
      key: "mod+shift+f",
      label: "⇧⌘F",
      description: "Search sessions",
      action: () => {
        window.dispatchEvent(new CustomEvent("pi:search-focus"));
      },
    },
    {
      key: "mod+p",
      label: "⌘P",
      description: "Quick file open",
      action: () => {
        window.dispatchEvent(new CustomEvent("pi:quick-open"));
      },
    },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const modPressed = e.metaKey || e.ctrlKey;

      for (const s of shortcuts) {
        if (matchesShortcut(e, s.key)) {
          if (!modPressed && s.key !== "escape" && isInput) continue;
          e.preventDefault();
          e.stopPropagation();
          s.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [shortcuts]);

  return shortcuts;
}

function matchesShortcut(e: KeyboardEvent, pattern: string): boolean {
  const parts = pattern.split("+");
  const key = parts[parts.length - 1];

  const needMod = parts.includes("mod");
  const needShift = parts.includes("shift");
  const needAlt = parts.includes("alt");

  const modPressed = e.metaKey || e.ctrlKey;

  if (needMod && !modPressed) return false;
  if (needShift && !e.shiftKey) return false;
  if (needAlt && !e.altKey) return false;
  if (!needMod && modPressed) return false;
  if (!needShift && e.shiftKey && parts.length > 1) return false;

  return e.key.toLowerCase() === key;
}
