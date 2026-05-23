import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import type { Message } from "@/stores/agentStore";
import ToolCallPanel from "./ToolCallPanel";

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#1f2937] px-4 py-2.5 text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="space-y-2">
      {/* Markdown content */}
      {message.content && (
        <div className="prose prose-invert prose-sm max-w-none text-[#e6edf3] [&_pre]:bg-[#161b22] [&_pre]:rounded-md [&_pre]:overflow-auto [&_pre]:p-3 [&_code]:text-[#e6edf3] [&_code]:before:content-none [&_code]:after:content-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_h1]:text-[#e6edf3] [&_h2]:text-[#e6edf3] [&_h3]:text-[#e6edf3] [&_a]:text-[#58a6ff] [&_a]:no-underline [&_a:hover]:underline [&_blockquote]:border-l-[#58a6ff] [&_blockquote]:text-[#8b949e]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}

      {/* Streaming cursor */}
      {message.isStreaming && !message.content && (
        <div className="flex items-center gap-1 text-[#8b949e]">
          <span className="inline-block h-4 w-0.5 animate-pulse bg-[#58a6ff]" />
        </div>
      )}
      {message.isStreaming && message.content && (
        <span className="inline-block h-4 w-0.5 animate-pulse bg-[#58a6ff] align-text-bottom ml-0.5" />
      )}

      {/* Tool calls */}
      {message.toolCalls.length > 0 && (
        <div className="space-y-1">
          {message.toolCalls.map((tc) => (
            <ToolCallPanel key={tc.toolCallId} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  );
}
