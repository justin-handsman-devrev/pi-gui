import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface ScrollToBottomFABProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  unreadCount: number;
  onScrollToBottom: () => void;
}

export default function ScrollToBottomFAB({
  scrollRef,
  unreadCount,
  onScrollToBottom,
}: ScrollToBottomFABProps) {
  const [visible, setVisible] = useState(false);

  const checkIfNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setVisible(!checkIfNearBottom());
      }, 50);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (timer) clearTimeout(timer);
    };
  }, [scrollRef, checkIfNearBottom]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          onClick={onScrollToBottom}
          className="hover-surface absolute bottom-4 left-1/2 z-10 flex items-center gap-2"
          style={{
            transform: "translateX(-50%)",
            background: "var(--surface-card)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--r-pill)",
            padding: "8px 12px",
            boxShadow: "var(--shadow-hover)",
            cursor: "pointer",
            color: "var(--body-strong)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <ArrowDown size={13} />
          {unreadCount > 0 && (
            <span
              className="flex h-4 min-w-4 items-center justify-center rounded-full"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
                fontSize: 10,
                fontWeight: 600,
                padding: "0 8px",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span>Scroll to bottom</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
