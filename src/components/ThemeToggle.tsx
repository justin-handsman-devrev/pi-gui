import { useCallback, useLayoutEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { applyTheme } from "@/components/settings/settings-ui";

export default function ThemeToggle() {
  const theme = useUIStore((s) => s.settings.theme);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const isDark = theme === "dark";

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    const newTheme = isDark ? "light" : "dark";
    updateSettings({ theme: newTheme });
  }, [isDark, updateSettings]);

  return (
    <button
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
