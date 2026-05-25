import { useState, useCallback, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { User, Bot, Copy, Check, FileCode } from "lucide-react";
import "highlight.js/styles/github.css";
import type { Message } from "@/stores/agentStore";
import ToolCallStack from "./ToolCallStack";
import ThinkingBlock from "./ThinkingBlock";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/canvas/canvasStore";

/* ── Code Block ──────────────────────────────────────────────────────────── */

function CodeBlock({ className, children }: { className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "";
  const codeText = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeText]);

  const handleOpenInCanvas = useCallback(() => {
    // This is a best-effort - the code may not map to a file
    // But we can open a temporary file view
    const setCanvasVisible = useUIStore.getState().setCanvasVisible;
    const setActiveFile = useCanvasStore.getState().setActiveFile;
    setCanvasVisible(true);
    // Create a virtual file entry
    setActiveFile(`untitled.${lang || "txt"}`);
  }, [lang]);

  return (
    <div
      className="group relative my-3 overflow-hidden"
      style={{
        background: "var(--canvas)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-lg)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3"
        style={{ borderBottom: "1px solid var(--hairline)", height: 32, minHeight: 32 }}
      >
        <span className="type-label" style={{ fontSize: 11, lineHeight: 1 }}>
          {lang || "code"}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleOpenInCanvas}
            className="code-action flex items-center gap-1 rounded-sm px-1.5 py-0.5 opacity-0 group-hover:opacity-100 translate-y-0.5 group-hover:translate-y-0"
            style={{
              fontSize: 11,
              border: "none",
              cursor: "pointer",
            }}
            title="Open in Canvas"
          >
            <FileCode size={11} />
            <span>Open</span>
          </button>
          <button
            onClick={handleCopy}
            className="code-action flex items-center gap-1 rounded-sm px-1.5 py-0.5"
            style={{
              fontSize: 11,
              color: copied ? "var(--success)" : undefined,
              border: "none",
              cursor: "pointer",
            }}
            title="Copy code"
          >
            {copied ? (
              <>
                <Check size={11} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto px-4 py-3" style={{ margin: 0, background: "transparent" }}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

/* ── Inline Code ─────────────────────────────────────────────────────────── */

function InlineCode({ children }: { children?: ReactNode }) {
  return (
    <code
      className="font-mono"
      style={{
        fontSize: "0.875em",
        background: "var(--surface-strong)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-xs)",
        padding: "0.1em 0.4em",
        color: "var(--accent-code)",
      }}
    >
      {children}
    </code>
  );
}

const markdownComponents = {
  pre({ children }: { children?: ReactNode }) {
    return <>{children}</>;
  },
  code({ className, children }: { className?: string; children?: ReactNode; node?: unknown }) {
    const isBlock = typeof children === "string" && children.includes("\n");
    if (isBlock || className) return <CodeBlock className={className}>{children}</CodeBlock>;
    return <InlineCode>{children}</InlineCode>;
  },
};

/* ── Streaming Indicator ─────────────────────────────────────────────────── */

function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 0.15, 0.3].map((delay, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--muted-soft)",
            animation: `pulse-dot 1.4s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

/**
 * Extract thinking content from message content.
 * Pi sends thinking blocks as separate content blocks with type "thinking".
 */
function extractThinkingContent(content: string): { thinking: string | null; displayContent: string } {
  // Check for thinking blocks in the content - they appear between <thinking> tags
  // or as 🔤 prefix blocks
  const thinkingMatch = content.match(/^💭([\s\S]*?)(?:\n---\n|\n\n)([\s\S]*)$/);
  if (thinkingMatch) {
    return {
      thinking: thinkingMatch[1].trim(),
      displayContent: thinkingMatch[2],
    };
  }

  // Check for <thinking>...</thinking> tags
  const tagMatch = content.match(/^<thinking>([\s\S]*?)<\/thinking>\s*\n*([\s\S]*)$/);
  if (tagMatch) {
    return {
      thinking: tagMatch[1].trim(),
      displayContent: tagMatch[2],
    };
  }

  return { thinking: null, displayContent: content };
}

/* ── Message Bubble ──────────────────────────────────────────────────────── */

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="chat-message chat-message-user">
        <div className="chat-message-body">
          <div className="chat-bubble chat-bubble-user">
            {message.content}
          </div>
        </div>
        <div className="chat-avatar chat-avatar-user">
          <User size={14} />
        </div>
      </div>
    );
  }

  // Resolve thinking + response text for assistant messages.
  const hasTools = message.toolCalls.length > 0;
  const thinkingFromMessage = message.thinking?.trim() || null;
  const legacyExtract = extractThinkingContent(message.content);
  const thinking = thinkingFromMessage ?? legacyExtract.thinking;
  const responseText = message.content.trim() || legacyExtract.displayContent.trim();
  const preambleText = message.preamble?.trim() ?? "";
  const showPreamble = !hasTools && !!preambleText;
  const showResponse = !!responseText || (message.isStreaming && hasTools);

  return (
    <div className="chat-message chat-message-assistant">
      <div className="chat-avatar chat-avatar-assistant">
        <Bot size={14} />
      </div>

      <div className="chat-message-body chat-message-assistant-body">
        {thinking && (
          <ThinkingBlock content={thinking} />
        )}

        {hasTools && (
          <ToolCallStack toolCalls={message.toolCalls} />
        )}

        {showPreamble && (
          <div className="prose-chat">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {preambleText}
            </ReactMarkdown>
          </div>
        )}

        {showResponse && responseText && (
          <div className="prose-chat">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {responseText}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="chat-stream-cursor" />
            )}
          </div>
        )}

        {message.isStreaming && !responseText && !showPreamble && !hasTools && (
          <div className="py-2">
            <StreamingIndicator />
          </div>
        )}

        {message.isStreaming && hasTools && !responseText && (
          <div className="py-1">
            <StreamingIndicator />
          </div>
        )}
      </div>
    </div>
  );
}
