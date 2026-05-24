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
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-center relative"
        >
          {/* Aurora glow behind π */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="aurora-orb-lavender w-32 h-32 opacity-40" />
          </div>

          {/* π Logo */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <span className="text-[48px] tracking-[-1.44px] text-[#fafaf9] font-normal">
              π
            </span>
          </div>

          <h2 className="text-[20px] leading-[1.35] text-[#fafaf9] font-medium">
            Start a conversation
          </h2>
          <p className="mt-2 text-[13px] text-[#78716c]">
            Ask Pi to code, debug, refactor, or anything else.
          </p>

          {/* Keyboard shortcuts hint */}
          <div className="mt-8 flex items-center justify-center gap-3 text-[13px]">
            <div className="flex items-center gap-1.5 rounded-full bg-[#1c1917] px-3 py-1.5">
              <kbd className="text-[11px] text-[#78716c] font-mono">Enter</kbd>
              <span className="text-[#a8a29e]">Send</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-[#1c1917] px-3 py-1.5">
              <kbd className="text-[11px] text-[#78716c] font-mono">Shift+Enter</kbd>
              <span className="text-[#a8a29e]">Newline</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-[#1c1917] px-3 py-1.5">
              <kbd className="text-[11px] text-[#78716c] font-mono">Esc</kbd>
              <span className="text-[#a8a29e]">Abort</span>
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
