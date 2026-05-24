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
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-4 pb-3 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 transition-colors duration-150 focus-within:border-violet-500">
          {/* Left: model badge */}
          <div className="shrink-0 pb-1">
            <span className="inline-flex items-center rounded-md bg-zinc-700/60 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
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
            className="flex-1 resize-none bg-transparent text-sm leading-6 text-zinc-50 outline-none placeholder:text-zinc-500"
            style={{ maxHeight: `${LINE_HEIGHT * MAX_ROWS}px` }}
          />

          {/* Right: action buttons */}
          <div className="flex shrink-0 items-center gap-1 pb-0.5">
            {/* Attach button (disabled placeholder) */}
            <button
              type="button"
              disabled
              className="rounded-lg p-1.5 text-zinc-600 transition-colors duration-150 hover:bg-zinc-700 hover:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors duration-150 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Steer agent"
                  >
                    <CornerDownLeft size={12} />
                    Steer
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    className="flex items-center justify-center rounded-lg bg-red-500/15 p-1.5 text-red-400 transition-colors duration-150 hover:bg-red-500/25"
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
                  className={`flex items-center justify-center rounded-lg p-1.5 transition-all duration-150 ${
                    canSend
                      ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:brightness-110"
                      : "bg-zinc-700 text-zinc-500"
                  } disabled:cursor-not-allowed`}
                  title="Send (Enter)"
                >
                  <Send size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-1.5 flex items-center justify-between px-1">
          <p className="text-[11px] text-zinc-600">
            {isStreaming
              ? "Type to steer · Esc to abort"
              : "Enter to send · Shift+Enter for newline"}
          </p>
        </div>
      </div>
    </div>
  );
}
