import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAgentStore } from "@/stores/agentStore";
import { setThinkingLevel as rpcSetThinkingLevel } from "@/lib/tauri-commands";

type Level = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

const LEVELS: Level[] = ["off", "minimal", "low", "medium", "high", "xhigh"];

/**
 * Thinking level selector with ElevenLabs-inspired segmented pill design:
 * - Container: ink-700/30 background, pill shape
 * - Active: solid ink pill (#292524) with white text
 * - Inactive: transparent with muted text
 * - Smooth layoutId animation for the active indicator
 */
export default function ThinkingSelector() {
  const currentLevel = useAgentStore((s) => s.thinkingLevel);
  const storeSetLevel = useAgentStore((s) => s.setThinkingLevel);
  const [pending, setPending] = useState<string | null>(null);

  const handleSelect = useCallback(async (level: Level) => {
    if (pending) return;
    setPending(level);
    try {
      await rpcSetThinkingLevel(level);
      storeSetLevel(level);
    } catch (err) {
      console.error("[ThinkingSelector] failed to set level:", err);
    } finally {
      setPending(null);
    }
  }, [pending, storeSetLevel]);

  return (
    <div className="flex rounded-full bg-[#44403c]/30 p-0.5">
      {LEVELS.map((level) => {
        const isActive = currentLevel.toLowerCase() === level;
        const isDisabled = pending !== null && pending !== level;

        return (
          <button
            key={level}
            onClick={() => handleSelect(level)}
            disabled={isDisabled}
            className={`
              relative rounded-full px-3 py-1.5 text-[12px] font-medium capitalize
              transition-colors duration-150 disabled:opacity-50
            `}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId="thinking-pill-bg"
                className="absolute inset-0 rounded-full bg-[#292524]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? "text-[#fafaf9]" : "text-[#78716c] hover:text-[#a8a29e]"}`}>
              {level}
            </span>
          </button>
        );
      })}
    </div>
  );
}
