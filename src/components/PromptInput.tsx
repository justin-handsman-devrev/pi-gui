import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { useAgentStore } from "@/stores/agentStore";
import { sendPrompt, steer, abortAgent } from "@/lib/tauri-commands";

const MAX_ROWS = 6;

export default function PromptInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addUserMessage = useAgentStore((s) => s.addUserMessage);
  const isStreaming = useAgentStore((s) => s.isStreaming);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isStreaming) {
      // Steer the agent mid-stream
      try {
        await steer(trimmed);
      } catch (err) {
        console.error("steer failed:", err);
      }
    } else {
      // Normal send
      addUserMessage(trimmed);
      try {
        await sendPrompt(trimmed);
      } catch (err) {
        console.error("sendPrompt failed:", err);
      }
    }

    setText("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, isStreaming, addUserMessage]);

  const handleAbort = useCallback(async () => {
    try {
      await abortAgent();
    } catch (err) {
      console.error("abort failed:", err);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape" && isStreaming) {
        e.preventDefault();
        handleAbort();
      }
    },
    [handleSend, handleAbort, isStreaming],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
    const maxH = lineHeight * MAX_ROWS;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, []);

  return (
    <div className="flex items-end gap-2 px-4 py-3">
      {/* Prefix */}
      <span className="flex-shrink-0 text-[#484f58] font-mono text-sm pb-1.5 select-none">
        &gt;
      </span>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        placeholder={isStreaming ? "Steer the agent…" : "Send a message…"}
        rows={1}
        className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] font-mono outline-none focus:border-[#58a6ff] transition-colors overflow-y-auto"
        style={{ maxHeight: `${6 * 24}px` }}
      />

      {/* Buttons */}
      <div className="flex gap-1 pb-1">
        {isStreaming ? (
          <>
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              className="flex items-center gap-1 rounded-lg bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#d29922] hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Steer agent"
            >
              Steer
            </button>
            <button
              type="button"
              onClick={handleAbort}
              className="flex items-center justify-center rounded-lg bg-[#21262d] px-2.5 py-1.5 text-sm text-[#f85149] hover:bg-[#30363d] transition-colors"
              title="Abort (Esc)"
            >
              ■
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            className="flex items-center justify-center rounded-lg bg-[#21262d] px-2.5 py-1.5 text-sm text-[#3fb950] hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send (Enter)"
          >
            ▶
          </button>
        )}
      </div>
    </div>
  );
}
