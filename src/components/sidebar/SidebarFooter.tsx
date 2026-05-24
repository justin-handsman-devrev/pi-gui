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
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        {/* Status indicator dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {isStreaming && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isStreaming ? "bg-violet-400" : "bg-emerald-400"
            }`}
          />
        </span>

        {/* Model info */}
        {model ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-1.5">
              <Cpu size={12} className="shrink-0 text-zinc-500" />
              <span className="truncate text-[12px] font-medium text-zinc-300">
                {displayModelName(model)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 pl-[18px]">
              <span className="text-[10px] text-zinc-500">
                {model.provider}
              </span>
              <span className="text-zinc-700">·</span>
              <span className="text-[10px] text-zinc-500">
                thinking: {displayThinkingLevel(thinkingLevel)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Cpu size={12} className="shrink-0 text-zinc-600" />
            <span className="text-[12px] text-zinc-600">No model loaded</span>
          </div>
        )}
      </div>
    </div>
  );
}
