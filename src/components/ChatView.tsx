import { useRef, useEffect } from "react";
import { useAgentStore } from "@/stores/agentStore";
import MessageBubble from "./MessageBubble";

export default function ChatView() {
  const messages = useAgentStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-[#484f58] text-sm select-none">
        <div className="text-center space-y-2">
          <div className="text-4xl">π</div>
          <div>Start a conversation</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {/* Scroll anchor */}
      <div ref={bottomRef} className="h-1" />
      {/* Breathing room at the bottom */}
      <div className="h-4" />
    </div>
  );
}
