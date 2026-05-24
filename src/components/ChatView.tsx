import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAgentStore } from "@/stores/agentStore";
import MessageBubble from "./MessageBubble";

export default function ChatView() {
  const messages = useAgentStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Track whether the user is near the bottom before new messages arrive
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 120; // pixels from bottom
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Auto-scroll only when near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Empty state ─────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center select-none">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          {/* Logo with glow */}
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl" />
            <span className="gradient-text relative text-5xl font-bold">
              π
            </span>
          </div>

          <p className="text-base font-medium text-zinc-400">
            Start a conversation
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Ask Pi to code, debug, refactor, or anything else.
          </p>

          {/* Keyboard shortcuts hint */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-600">
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                Enter
              </kbd>
              <span>Send</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                Shift+Enter
              </kbd>
              <span>Newline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                Esc
              </kbd>
              <span>Abort</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Messages list ───────────────────────────────────────────────────────
  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
              delay: i === messages.length - 1 ? 0.05 : 0,
            }}
          >
            <MessageBubble message={msg} />
          </motion.div>
        ))}
        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-1" />
        {/* Breathing room */}
        <div className="h-4" />
      </div>
    </div>
  );
}
