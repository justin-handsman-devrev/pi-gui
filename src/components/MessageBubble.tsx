import { useState, useCallback, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { User, Bot, Copy, Check } from "lucide-react";
import "highlight.js/styles/github-dark.css";
import type { Message } from "@/stores/agentStore";
import ToolCallPanel from "./ToolCallPanel";

// ── Code Block Component ─────────────────────────────────────────────────

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeText = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeText]);

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl bg-[#1c1917] border border-[rgba(255,255,255,0.06)]">
      {/* Header bar — minimal */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-3 py-2">
        <span className="text-[11px] uppercase tracking-wider text-[#78716c]">
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="text-[#a8a29e] hover:text-[#fafaf9] transition-colors duration-150 flex items-center gap-1 text-[11px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-[#5fb8a3]" />
              <span className="text-[#5fb8a3]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 !bg-transparent !m-0">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

// ── Inline Code Component ────────────────────────────────────────────────

function InlineCode({ children }: { children?: ReactNode }) {
  return (
    <code className="rounded-md bg-[#44403c]/50 px-1.5 py-0.5 font-mono text-[13px] text-[#9d8bb8]">
      {children}
    </code>
  );
}

// ── Markdown Components Map ──────────────────────────────────────────────

const markdownComponents = {
  pre({ children }: { children?: ReactNode }) {
    // The <pre> wraps a <code> which already has the CodeBlock treatment.
    // React-markdown puts <code> inside <pre>, so we just render children.
    return <>{children}</>;
  },
  code({
    className,
    children,
  }: {
    className?: string;
    children?: ReactNode;
    node?: unknown;
  }) {
    const isBlock = typeof children === "string" && children.includes("\n");
    if (isBlock || className) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return <InlineCode>{children}</InlineCode>;
  },
};

// ── Streaming Indicator ──────────────────────────────────────────────────

function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-[#9d8bb8] animate-pulse" />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[#9d8bb8] animate-pulse"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[#9d8bb8] animate-pulse"
        style={{ animationDelay: "0.3s" }}
      />
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  // ── User Message ──────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5">
        <div className="max-w-[80%]">
          <div className="rounded-2xl bg-[#44403c] px-4 py-3 text-[15px] leading-[1.6] text-[#fafaf9] whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1c1917] text-[#a8a29e]">
          <User size={14} />
        </div>
      </div>
    );
  }

  // ── Assistant Message ─────────────────────────────────────────────────
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1c1917] text-[#9d8bb8]">
        <Bot size={14} />
      </div>
      <div className="min-w-0 max-w-[90%] flex-1 space-y-2">
        {/* Markdown content */}
        {message.content && (
          <div className="prose-chat">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Streaming indicator when no content yet */}
        {message.isStreaming && !message.content && (
          <div className="py-2">
            <StreamingIndicator />
          </div>
        )}

        {/* Blinking cursor when streaming with content */}
        {message.isStreaming && message.content && (
          <span className="inline-block h-4 w-0.5 animate-pulse bg-[#9d8bb8] align-text-bottom" />
        )}

        {/* Tool calls */}
        {message.toolCalls.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {message.toolCalls.map((tc) => (
              <ToolCallPanel key={tc.toolCallId} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
