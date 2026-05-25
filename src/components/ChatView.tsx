import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useAgentStore } from "@/stores/agentStore";
import MessageBubble from "./MessageBubble";
import ScrollToBottomFAB from "./ScrollToBottomFAB";
import DragDropOverlay from "./DragDropOverlay";

const STARTER_PROMPTS = [
  "Explain this codebase",
  "Find and fix a bug",
  "Add a new feature",
  "Write tests for…",
];

const SHORTCUTS = [
  { key: "Enter", label: "Send" },
  { key: "⌘K", label: "Commands" },
  { key: "Esc", label: "Abort" },
  { key: "⌘N", label: "New chat" },
];

export default function ChatView() {
  const messages = useAgentStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    } else {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
    isNearBottomRef.current = true;
  }, []);

  const handleFilesDropped = useCallback((files: File[]) => {
    window.dispatchEvent(
      new CustomEvent("pi:attach-files", { detail: { files } }),
    );
  }, []);

  const handleStarterClick = useCallback((prompt: string) => {
    window.dispatchEvent(
      new CustomEvent("pi:prefill-prompt", { detail: { text: prompt } }),
    );
  }, []);

  if (messages.length === 0) {
    return (
      <div className="chat-empty">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="chat-empty-inner"
        >
          <div className="chat-empty-mark">π</div>

          <h2 className="chat-empty-title">What are we building?</h2>
          <p className="chat-empty-lede">
            Ask Pi to code, debug, refactor, or explore your codebase.
          </p>

          <div className="chat-starter-grid">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chat-starter-chip"
                onClick={() => handleStarterClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="chat-shortcut-row">
            {SHORTCUTS.map(({ key, label }) => (
              <div key={key} className="chat-shortcut-chip">
                <kbd>{key}</kbd>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="chat-thread-wrap">
      <DragDropOverlay onFilesDropped={handleFilesDropped}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="chat-thread"
        >
          <div className="chat-thread-inner">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  ease: "easeOut",
                  delay: i === messages.length - 1 ? 0.04 : 0,
                }}
              >
                <MessageBubble message={msg} />
              </motion.div>
            ))}
            <div ref={bottomRef} className="h-1" />
          </div>
        </div>
      </DragDropOverlay>
      <ScrollToBottomFAB
        scrollRef={scrollRef}
        unreadCount={unreadCount}
        onScrollToBottom={scrollToBottom}
      />
    </div>
  );
}
