import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Wrench } from "lucide-react";
import type { ToolCallInfo } from "@/stores/agentStore";
import { summarizeToolCalls } from "@/lib/tool-utils";
import ToolCallPanel from "./ToolCallPanel";

interface ToolCallStackProps {
  toolCalls: ToolCallInfo[];
}

export default function ToolCallStack({ toolCalls }: ToolCallStackProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
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
    updateFades();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateFades);
    observer.observe(el);

    return () => observer.disconnect();
  }, [updateFades, toolCalls]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || summary.running === 0) return;
    el.scrollTop = el.scrollHeight;
    updateFades();
  }, [toolCalls.length, summary.running, updateFades]);

  const headerLabel = summary.running > 0
    ? summary.running === 1
      ? "Running tool"
      : `Running ${summary.running} tools`
    : summary.total === 1
      ? "1 tool used"
      : `${summary.total} tools used`;

  return (
    <section className="chat-tool-stack" aria-label="Agent tools">
      <header className="chat-tool-stack-header">
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
        </div>
      </header>

      <div className="chat-tool-call-stack-wrap">
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
      </div>
    </section>
  );
}
