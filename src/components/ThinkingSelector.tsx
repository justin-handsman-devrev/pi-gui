import { useAgentStore } from "@/stores/agentStore";
import { setThinkingLevel as rpcSetThinkingLevel } from "@/lib/tauri-commands";

type Level = "off" | "low" | "medium" | "high";

const LEVELS: Level[] = ["off", "low", "medium", "high"];

/**
 * Inline thinking-level toggle: Off / Low / Medium / High.
 */
export default function ThinkingSelector() {
  const currentLevel = useAgentStore((s) => s.thinkingLevel);
  const storeSetLevel = useAgentStore((s) => s.setThinkingLevel);

  const handleSelect = async (level: Level) => {
    try {
      await rpcSetThinkingLevel(level);
      storeSetLevel(level);
    } catch (err) {
      console.error("[ThinkingSelector] failed to set level:", err);
    }
  };

  return (
    <div className="flex items-center gap-0.5 rounded bg-dark-bg p-0.5">
      {LEVELS.map((level) => {
        const isActive =
          currentLevel.toLowerCase() === level;
        return (
          <button
            key={level}
            onClick={() => handleSelect(level)}
            className={`
              rounded px-2 py-0.5 text-xs font-medium capitalize transition-colors
              ${
                isActive
                  ? "bg-dark-elevated text-accent-blue shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }
            `}
            aria-pressed={isActive}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}
