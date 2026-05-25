import { AlignLeft, Columns, Minimize2, Moon, Sun, Type, ZoomIn } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { clampFontSize, FONT_SIZE_MAX, FONT_SIZE_MIN } from "@/lib/app-settings";
import AppZoomControl from "@/components/AppZoomControl";
import {
  applyTheme,
  SegmentedControl,
  SettingRow,
  SettingSection,
  SettingToggle,
} from "./settings-ui";

export default function GeneralTab() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  const setTheme = (theme: "dark" | "light") => {
    updateSettings({ theme });
    applyTheme(theme);
  };

  return (
    <div className="settings-page">
      <SettingSection title="Appearance" description="Theme and reading comfort.">
        <SettingRow
          icon={<Sun size={15} />}
          title="Color theme"
          description="Switch between light and dark interface."
        >
          <SegmentedControl
            value={settings.theme}
            options={[
              { value: "light" as const, label: "Light", icon: <Sun size={12} /> },
              { value: "dark" as const, label: "Dark", icon: <Moon size={12} /> },
            ]}
            onChange={setTheme}
          />
        </SettingRow>

        <SettingRow
          icon={<Type size={15} />}
          title="Font size"
          description="Base size for messages and code (12–20px)."
        >
          <div className="settings-range">
            <input
              type="range"
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              step={1}
              value={settings.fontSize}
              onChange={(event) => {
                updateSettings({ fontSize: clampFontSize(Number(event.target.value)) });
              }}
              className="settings-range-input"
            />
            <span className="settings-range-value">{settings.fontSize}px</span>
          </div>
        </SettingRow>

        <SettingRow
          icon={<ZoomIn size={15} />}
          title="App zoom"
          description="Scale the entire interface (75–150%)."
        >
          <AppZoomControl variant="settings" />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Editor & canvas" description="How files and chat are displayed.">
        <SettingRow
          icon={<AlignLeft size={15} />}
          title="Line numbers"
          description="Show line numbers in the canvas editor."
        >
          <SettingToggle
            checked={settings.showLineNumbers}
            onChange={(value) => updateSettings({ showLineNumbers: value })}
            label="Show line numbers"
          />
        </SettingRow>

        <SettingRow
          icon={<Columns size={15} />}
          title="Auto-open canvas"
          description="Open the canvas when the agent references a file."
        >
          <SettingToggle
            checked={settings.canvasAutoOpen}
            onChange={(value) => updateSettings({ canvasAutoOpen: value })}
            label="Auto-open canvas"
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Chat" description="Message list density.">
        <SettingRow
          icon={<Minimize2 size={15} />}
          title="Compact messages"
          description="Tighter spacing and smaller text in the chat stream."
        >
          <SettingToggle
            checked={settings.compactMessages}
            onChange={(value) => updateSettings({ compactMessages: value })}
            label="Compact messages"
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
