import { Cpu } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";

/** Friendly model name from the raw provider/id. */
function displayModelName(model: { provider: string; id: string }): string {
  // Extract the short name after the last slash or colon
  const raw = model.id;
  const lastSlash = raw.lastIndexOf("/");
  const lastColon = raw.lastIndexOf(":");
  const idx = Math.max(lastSlash, lastColon);
  const short = idx >= 0 ? raw.slice(idx + 1) : raw;

  // Capitalize first letter
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** Format thinking level for display. */
function displayThinkingLevel(level: string): string {
  const map: Record<string, string> = {
    none: "off",
    low: "low",
    medium: "med",
    high: "high",
  };
  return map[level] ?? level;
}

export default function SidebarFooter() {
  const model = useAgentStore((s) => s.model);
  const thinkingLevel = useAgentStore((s) => s.thinkingLevel);
  const isStreaming = useAgentStore((s) => s.isStreaming);

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-[#292524]/30 px-3 py-2.5">
      <div className="flex items-center gap-2">
        {/* Status indicator dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {isStreaming && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9d8bb8] opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isStreaming ? "bg-[#9d8bb8]" : "bg-[#5fb8a3]"
            }`}
          />
        </span>

        {/* Model info */}
        {model ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-1.5">
              <Cpu size={12} className="shrink-0 text-[#78716c]" />
              <span className="truncate text-[12px] font-medium text-[#fafaf9]">
                {displayModelName(model)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 pl-[18px]">
              <span className="text-[10px] text-[#78716c]">
                {model.provider}
              </span>
              <span className="text-[#57534e]">·</span>
              <span className="text-[10px] text-[#78716c]">
                thinking: {displayThinkingLevel(thinkingLevel)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Cpu size={12} className="shrink-0 text-[#57534e]" />
            <span className="text-[12px] text-[#57534e]">No model loaded</span>
          </div>
        )}
      </div>
    </div>
  );
}
