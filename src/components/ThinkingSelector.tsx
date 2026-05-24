import { motion } from "framer-motion";
import { useAgentStore } from "@/stores/agentStore";
import { setThinkingLevel as rpcSetThinkingLevel } from "@/lib/tauri-commands";

type Level = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

const LEVELS: Level[] = ["off", "minimal", "low", "medium", "high", "xhigh"];

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
    <div className="flex items-center gap-0.5 rounded-lg bg-zinc-800 p-0.5">
      {LEVELS.map((level) => {
        const isActive = currentLevel.toLowerCase() === level;
        return (
          <button
            key={level}
            onClick={() => handleSelect(level)}
            className={`
              relative rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors duration-150
              ${
                isActive
                  ? "text-white"
                  : "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
              }
            `}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.span
                layoutId="thinking-pill-bg"
                className="absolute inset-0 rounded-md bg-violet-500"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{level}</span>
          </button>
        );
      })}
    </div>
  );
}
