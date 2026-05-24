import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Square,
  Paperclip,
  CornerDownLeft,
} from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { sendPrompt, steer, abortAgent } from "@/lib/tauri-commands";

const MAX_ROWS = 6;
const LINE_HEIGHT = 24;

export default function PromptInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addUserMessage = useAgentStore((s) => s.addUserMessage);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const model = useAgentStore((s) => s.model);

  const modelLabel = model
    ? model.id
        .replace(/-\d{8}$/, "")
        .split("/")
        .pop() ?? model.id
    : "No model";

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isStreaming) {
      try {
        await steer(trimmed);
      } catch (err) {
        console.error("steer failed:", err);
      }
    } else {
      addUserMessage(trimmed);
      try {
        await sendPrompt(trimmed);
      } catch (err) {
        console.error("sendPrompt failed:", err);
      }
    }

    setText("");
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
    const maxH = LINE_HEIGHT * MAX_ROWS;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, []);

  const canSend = text.trim().length > 0;

  return (
    <div className="shrink-0 px-4 pb-4 pt-3">
      <div className="mx-auto max-w-3xl">
        {/* Pill-shaped input container */}
        <div className="relative rounded-full border border-[rgba(255,255,255,0.06)] bg-[#131210] transition-all duration-150 focus-within:border-[#9d8bb8] focus-within:ring-2 focus-within:ring-[#9d8bb8]/20">
          <div className="flex items-end gap-3 px-5 py-3">
            {/* Left: model badge */}
            <div className="shrink-0 pb-0.5">
              <span className="inline-flex items-center rounded-full bg-[#1c1917] px-2 py-1 text-[11px] text-[#78716c]">
                {modelLabel}
              </span>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleInput();
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming ? "Steer the agent…" : "Send a message…"
              }
              rows={1}
              className="flex-1 resize-none bg-transparent text-[15px] leading-6 text-[#fafaf9] outline-none placeholder:text-[#78716c]"
              style={{ maxHeight: `${LINE_HEIGHT * MAX_ROWS}px` }}
            />

            {/* Right: action buttons */}
            <div className="flex shrink-0 items-center gap-1.5 pb-0.5">
              {/* Attach button (disabled placeholder) */}
              <button
                type="button"
                disabled
                className="rounded-full p-2 text-[#57534e] transition-colors duration-150 hover:bg-[#1c1917] hover:text-[#78716c] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Attach file (coming soon)"
              >
                <Paperclip size={16} />
              </button>

              {/* Send / Steer / Abort */}
              <AnimatePresence mode="wait">
                {isStreaming ? (
                  <motion.div
                    key="streaming-buttons"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!canSend}
                      className="flex items-center gap-1.5 rounded-full bg-[#2a2522] px-3 py-1.5 text-[13px] text-[#d4a88c] transition-colors duration-150 hover:bg-[#3a3532] disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Steer agent"
                    >
                      <CornerDownLeft size={12} />
                      Steer
                    </button>
                    <button
                      type="button"
                      onClick={handleAbort}
                      className="flex items-center justify-center rounded-full bg-[#1c1917] p-2 text-[#78716c] transition-colors duration-150 hover:bg-[#2a2522] hover:text-[#a8a29e]"
                      title="Abort (Esc)"
                    >
                      <Square size={12} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="send-button"
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center justify-center rounded-full p-2 transition-all duration-150 ${
                      canSend
                        ? "bg-[#44403c] text-[#fafaf9] hover:bg-[#57534e]"
                        : "bg-[#1c1917] text-[#57534e]"
                    } disabled:cursor-not-allowed`}
                    title="Send (Enter)"
                  >
                    <Send size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-center px-1">
          <p className="text-[11px] text-[#57534e]">
            {isStreaming
              ? "Type to steer · Esc to abort"
              : "Enter to send · Shift+Enter for newline"}
          </p>
        </div>
      </div>
    </div>
  );
}