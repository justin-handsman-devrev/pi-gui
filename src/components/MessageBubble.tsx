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
    <div className="group relative my-3 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-zinc-500 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-300"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
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
    <code className="rounded border border-zinc-700/50 bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.875em] text-violet-300">
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
    <span className="inline-flex items-center gap-0.5">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"
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
          <div className="rounded-lg border-l-[3px] border-l-violet-400 bg-violet-500/10 px-4 py-3 text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-400">
          <User size={14} />
        </div>
      </div>
    );
  }

  // ── Assistant Message ─────────────────────────────────────────────────
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-violet-400">
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
          <span className="inline-block h-4 w-0.5 animate-pulse bg-violet-400 align-text-bottom" />
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
