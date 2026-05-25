import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeThinkingText } from "@/lib/sanitize-thinking";

interface ThinkingBlockProps {
  content: string;
}

export default function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const displayContent = useMemo(() => sanitizeThinkingText(content), [content]);

  if (!displayContent) return null;

  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--canvas-soft)",
        border: "1px solid var(--hairline-soft)",
        borderRadius: "var(--r-lg)",
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="hover-ghost flex w-full items-center gap-2"
        style={{
          padding: "12px 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "var(--muted)",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 14 }}>💭</span>
        <span>Thinking{expanded ? "" : ` (${displayContent.length} chars)`}</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ display: "flex", marginLeft: "auto" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <pre
              style={{
                padding: "12px",
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                lineHeight: 1.65,
                color: "var(--muted)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                borderTop: "1px solid var(--hairline-soft)",
              }}
            >
              {displayContent}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
