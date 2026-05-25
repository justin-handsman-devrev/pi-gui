import { useCallback, useEffect, useRef } from "react";
import { useAgentStore } from "@/stores/agentStore";
import { setThinkingLevel as rpcSetThinkingLevel } from "@/lib/tauri-commands";
import type { ThinkingLevel } from "./ThinkingLevelDropdown";

interface ThinkingToggleProps {
  onEnable?: (level: ThinkingLevel) => void;
}

export default function ThinkingToggle({ onEnable }: ThinkingToggleProps) {
  const thinkingLevel = useAgentStore((s) => s.thinkingLevel);
  const storeSetLevel = useAgentStore((s) => s.setThinkingLevel);
  const lastLevelRef = useRef<ThinkingLevel>("medium");

  const enabled = thinkingLevel.toLowerCase() !== "off";

  useEffect(() => {
    const normalized = thinkingLevel.toLowerCase();
    if (normalized !== "off" && normalized !== lastLevelRef.current) {
      lastLevelRef.current = normalized as ThinkingLevel;
    }
  }, [thinkingLevel]);

  const handleToggle = useCallback(async () => {
    const nextEnabled = !enabled;
    const level = nextEnabled ? lastLevelRef.current : "off";

    try {
      await rpcSetThinkingLevel(level);
      storeSetLevel(level);
      if (nextEnabled && level !== "off") {
        onEnable?.(level);
      }
    } catch (err) {
      console.error("[ThinkingToggle] failed:", err);
    }
  }, [enabled, onEnable, storeSetLevel]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Disable thinking" : "Enable thinking"}
      onClick={handleToggle}
      className={`app-footer-toggle ${enabled ? "is-on" : ""}`}
    >
      <span className="app-footer-toggle-thumb" />
    </button>
  );
}
