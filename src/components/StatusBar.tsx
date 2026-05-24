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
    <div className="flex h-7 items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 text-[13px] select-none">
      {/* Left — model & provider */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[#9d8bb8]">{modelName}</span>
        {model && (
          <span className="inline-flex items-center text-[11px] uppercase tracking-wide text-[#57534e]">
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
            className="flex items-center gap-1.5 text-[#9d8bb8]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#9d8bb8] animate-pulse" />
            <span>Streaming</span>
          </motion.span>
        )}
        {isCompacting && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-[#d4a88c]"
          >
            <Loader2 size={11} className="animate-spin" />
            <span>Compacting</span>
          </motion.span>
        )}
        {!isStreaming && !isCompacting && sessionStats && (
          <span className="flex items-center gap-1 text-[#57534e]">
            <Zap size={10} />
            {fmtTokens(sessionStats.tokens.total)} tokens
          </span>
        )}
      </div>

      {/* Right — session ID */}
      <div className="flex items-center gap-2 min-w-0">
        {sessionStats && (
          <span className="text-[#57534e]">
            {fmtTokens(sessionStats.tokens.input)}↓{" "}
            {fmtTokens(sessionStats.tokens.output)}↑
          </span>
        )}
        {sessionId && (
          <span className="flex items-center gap-1 text-[#57534e]">
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
