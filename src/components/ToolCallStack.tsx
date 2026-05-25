import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Wrench } from "lucide-react";
import type { ToolCallInfo } from "@/stores/agentStore";
import { summarizeToolCalls } from "@/lib/tool-utils";
import ToolCallPanel from "./ToolCallPanel";

interface ToolCallStackProps {
  toolCalls: ToolCallInfo[];
}

export default function ToolCallStack({ toolCalls }: ToolCallStackProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);
  const summary = summarizeToolCalls(toolCalls);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight - clientHeight > 2;
    setFadeTop(overflow && scrollTop > 2);
    setFadeBottom(overflow && scrollTop + clientHeight < scrollHeight - 2);
  }, []);

  useEffect(() => {
    if (collapsed) return;
    updateFades();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateFades);
    observer.observe(el);

    return () => observer.disconnect();
  }, [collapsed, updateFades, toolCalls]);

  useEffect(() => {
    if (collapsed) return;
    const el = scrollRef.current;
    if (!el || summary.running === 0) return;
    el.scrollTop = el.scrollHeight;
    updateFades();
  }, [collapsed, toolCalls.length, summary.running, updateFades]);

  const headerLabel = summary.running > 0
    ? summary.running === 1
      ? "Running tool"
      : `Running ${summary.running} tools`
    : summary.total === 1
      ? "1 tool used"
      : `${summary.total} tools used`;

  return (
    <section
      className={`chat-tool-stack${collapsed ? " is-collapsed" : ""}`}
      aria-label="Agent tools"
    >
      <button
        type="button"
        className="chat-tool-stack-header"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
      >
        <span className="chat-tool-stack-header-icon" aria-hidden="true">
          <Wrench size={13} strokeWidth={2} />
        </span>
        <span className="chat-tool-stack-header-label">{headerLabel}</span>
        <div className="chat-tool-stack-header-meta">
          {summary.running > 0 && (
            <span className="chat-tool-stack-live">
              <Loader2 size={11} className="animate-spin" aria-hidden="true" />
              Live
            </span>
          )}
          {summary.errors > 0 && (
            <span className="chat-tool-stack-errors">
              {summary.errors} failed
            </span>
          )}
          <motion.span
            className="chat-tool-stack-chevron"
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.15 }}
            aria-hidden="true"
          >
            <ChevronDown size={14} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="chat-tool-call-stack-wrap"
          >
            <div
              ref={scrollRef}
              className="chat-tool-call-stack"
              onScroll={updateFades}
            >
              <ol className="chat-tool-timeline">
                {toolCalls.map((toolCall, index) => (
                  <ToolCallPanel
                    key={toolCall.toolCallId}
                    toolCall={toolCall}
                    isLast={index === toolCalls.length - 1}
                  />
                ))}
              </ol>
            </div>
            <div
              className={`chat-tool-call-stack-fade chat-tool-call-stack-fade-top${fadeTop ? " is-visible" : ""}`}
              aria-hidden="true"
            />
            <div
              className={`chat-tool-call-stack-fade chat-tool-call-stack-fade-bottom${fadeBottom ? " is-visible" : ""}`}
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
