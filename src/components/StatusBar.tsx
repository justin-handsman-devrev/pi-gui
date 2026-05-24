import { motion } from "framer-motion";
import {
  Loader2,
  Zap,
  Hash,
} from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";

export default function StatusBar() {
  const model = useAgentStore((s) => s.model);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const isCompacting = useAgentStore((s) => s.isCompacting);
  const sessionStats = useAgentStore((s) => s.sessionStats);
  const sessionId = useAgentStore((s) => s.sessionId);

  const modelName = model
    ? (() => {
        const short = model.id
          .replace(/-\d{8}$/, "")
          .split("/")
          .pop() ?? model.id;
        return short.charAt(0).toUpperCase() + short.slice(1);
      })()
    : "No model";

  return (
    <div className="flex h-7 min-h-[28px] items-center justify-between border-t border-zinc-800 bg-zinc-900 px-3 text-[11px] select-none">
      {/* Left — model & provider */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-violet-400">{modelName}</span>
        {model && (
          <span className="inline-flex items-center rounded bg-zinc-800 px-1.5 py-px text-[10px] uppercase tracking-wide text-zinc-500">
            {model.provider}
          </span>
        )}
      </div>

      {/* Center — streaming / compaction status */}
      <div className="flex items-center gap-2">
        {isStreaming && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-violet-400"
          >
            <Loader2 size={11} className="animate-spin" />
            <span>Streaming</span>
          </motion.span>
        )}
        {isCompacting && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-amber-400"
          >
            <Loader2 size={11} className="animate-spin" />
            <span>Compacting</span>
          </motion.span>
        )}
        {!isStreaming && !isCompacting && sessionStats && (
          <span className="flex items-center gap-1 text-zinc-500">
            <Zap size={10} />
            {fmtTokens(sessionStats.tokens.total)} tokens
          </span>
        )}
      </div>

      {/* Right — session ID */}
      <div className="flex items-center gap-2 min-w-0">
        {sessionStats && (
          <span className="text-zinc-600">
            {fmtTokens(sessionStats.tokens.input)}↓{" "}
            {fmtTokens(sessionStats.tokens.output)}↑
          </span>
        )}
        {sessionId && (
          <span className="flex items-center gap-1 text-zinc-600">
            <Hash size={10} />
            {sessionId.slice(0, 8)}
          </span>
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
