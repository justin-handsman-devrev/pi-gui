import { useAgentStore } from "@/stores/agentStore";

export default function StatusBar() {
  const model = useAgentStore((s) => s.model);
  const thinkingLevel = useAgentStore((s) => s.thinkingLevel);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const isCompacting = useAgentStore((s) => s.isCompacting);
  const sessionStats = useAgentStore((s) => s.sessionStats);
  const sessionName = useAgentStore((s) => s.sessionName);

  const modelName = model ? `${model.provider} / ${model.id}` : "No model";

  return (
    <div className="flex h-7 min-h-[28px] items-center justify-between bg-[#161b22] border-t border-[#21262d] px-3 text-xs text-[#8b949e] select-none">
      {/* Left — model & thinking */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate">{modelName}</span>
        <span className="inline-flex items-center rounded bg-[#21262d] px-1.5 py-px text-[10px] uppercase tracking-wide text-[#8b949e]">
          {thinkingLevel}
        </span>
      </div>

      {/* Center — streaming / compaction */}
      <div className="flex items-center gap-2">
        {isStreaming && (
          <span className="flex items-center gap-1">
            <StreamingSpinner />
            <span>Streaming</span>
          </span>
        )}
        {isCompacting && (
          <span className="flex items-center gap-1 text-[#d29922]">
            <StreamingSpinner />
            <span>Compacting</span>
          </span>
        )}
      </div>

      {/* Right — tokens & session */}
      <div className="flex items-center gap-3 min-w-0">
        {sessionStats && (
          <span>
            {fmtTokens(sessionStats.tokens.input)}↓{" "}
            {fmtTokens(sessionStats.tokens.output)}↑
          </span>
        )}
        {sessionName && (
          <span className="truncate text-[#484f58]">{sessionName}</span>
        )}
      </div>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function StreamingSpinner() {
  return (
    <svg
      className="h-3 w-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
