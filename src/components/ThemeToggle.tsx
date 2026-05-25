import { useCallback } from "react";
import { Sun, Moon } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { applyTheme } from "@/lib/app-settings";

interface ThemeToggleProps {
  variant?: "default" | "icon";
}

export default function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const theme = useUIStore((s) => s.settings.theme);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const isDark = theme === "dark";

  const toggle = useCallback(() => {
    const newTheme = isDark ? "light" : "dark";
    updateSettings({ theme: newTheme });
    applyTheme(newTheme);
  }, [isDark, updateSettings]);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="app-footer-icon-btn"
        title={`Switch to ${isDark ? "light" : "dark"} theme`}
        aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-ghost flex items-center gap-2"
      style={{ height: 28, fontSize: 12, padding: "0 8px" }}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? <Sun size={13} /> : <Moon size={13} />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
