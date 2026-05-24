import { Sun, Moon, Type, AlignLeft, Columns, Minimize2 } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

// ── Toggle Switch Component ──────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
        transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-violet-500
        ${checked ? "bg-violet-500" : "bg-zinc-700"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
          transition-transform duration-150
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
        style={{ marginTop: 2, marginLeft: 2 }}
      />
    </button>
  );
}

// ── Setting Row Layout ───────────────────────────────────────────────────────

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ icon, title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg px-1 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-50">{title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0 pt-1">{children}</div>
    </div>
  );
}

// ── General Tab ──────────────────────────────────────────────────────────────

export default function GeneralTab() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  const handleFontSizeChange = (value: number) => {
    const clamped = Math.max(12, Math.min(20, value));
    updateSettings({ fontSize: clamped });
  };

  return (
    <div className="space-y-1">
      {/* Theme */}
      <SettingRow
        icon={<Moon size={16} />}
        title="Theme"
        description="Interface color scheme. Light mode is not yet available."
      >
        <div className="flex items-center gap-1 rounded-lg bg-zinc-800 p-0.5">
          <button
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              settings.theme === "dark"
                ? "bg-violet-500/20 text-violet-400"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
            onClick={() => updateSettings({ theme: "dark" })}
          >
            <Moon size={12} />
            Dark
          </button>
          <button
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              settings.theme === "light"
                ? "bg-violet-500/20 text-violet-400"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
            onClick={() => updateSettings({ theme: "light" })}
            title="Not yet available"
          >
            <Sun size={12} />
            Light
          </button>
        </div>
      </SettingRow>

      {/* Font Size */}
      <SettingRow
        icon={<Type size={16} />}
        title="Font Size"
        description="Base font size for code blocks and messages (12–20px)."
      >
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={12}
            max={20}
            step={1}
            value={settings.fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-violet-500"
          />
          <span className="w-8 text-right text-xs font-mono text-zinc-400 tabular-nums">
            {settings.fontSize}px
          </span>
        </div>
      </SettingRow>

      {/* Show Line Numbers */}
      <SettingRow
        icon={<AlignLeft size={16} />}
        title="Show Line Numbers"
        description="Display line numbers in the code canvas."
      >
        <Toggle
          checked={settings.showLineNumbers}
          onChange={(v) => updateSettings({ showLineNumbers: v })}
          label="Show line numbers"
        />
      </SettingRow>

      {/* Auto-open Canvas */}
      <SettingRow
        icon={<Columns size={16} />}
        title="Auto-open Canvas"
        description="Automatically open the canvas when a file is referenced."
      >
        <Toggle
          checked={settings.canvasAutoOpen}
          onChange={(v) => updateSettings({ canvasAutoOpen: v })}
          label="Auto-open canvas"
        />
      </SettingRow>

      {/* Compact Messages */}
      <SettingRow
        icon={<Minimize2 size={16} />}
        title="Compact Messages"
        description="Use reduced spacing and smaller text in chat messages."
      >
        <Toggle
          checked={settings.compactMessages}
          onChange={(v) => updateSettings({ compactMessages: v })}
          label="Compact messages"
        />
      </SettingRow>
    </div>
  );
}
