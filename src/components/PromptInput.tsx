import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Paperclip, CornerDownLeft } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { sendPrompt, steer, abortAgent } from "@/lib/tauri-commands";
import {
  attachmentsToRpcImages,
  buildPromptMessage,
  canSendWithAttachments,
  fileToAttachment,
  filesToAttachments,
  type PromptAttachment,
} from "@/lib/prompt-attachments";
import SlashCommandMenu from "./SlashCommandMenu";
import AttachmentPreview from "./AttachmentPreview";

const MAX_ROWS = 6;
const LINE_HEIGHT = 22;
const FILE_ACCEPT =
  "image/*,.txt,.md,.markdown,.json,.js,.ts,.tsx,.jsx,.css,.html,.yaml,.yml,.toml,.rs,.py,.go,.sh,.sql,.xml,.csv";

export default function PromptInput() {
  const [text, setText] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addUserMessage = useAgentStore((s) => s.addUserMessage);
  const isStreaming = useAgentStore((s) => s.isStreaming);

  const addAttachments = useCallback((next: PromptAttachment[]) => {
    if (next.length === 0) return;
    setAttachments((prev) => [...prev, ...next]);
  }, []);

  useEffect(() => {
    const onPrefill = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string }>).detail;
      const next = detail?.text?.trim();
      if (!next) return;
      setText(next);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(next.length, next.length);
      });
    };
    window.addEventListener("pi:prefill-prompt", onPrefill);
    return () => window.removeEventListener("pi:prefill-prompt", onPrefill);
  }, []);

  useEffect(() => {
    const onAttachFiles = (e: Event) => {
      const detail = (e as CustomEvent<{ files?: File[] }>).detail;
      const files = detail?.files;
      if (!files?.length) return;
      void filesToAttachments(files).then(addAttachments);
    };
    window.addEventListener("pi:attach-files", onAttachFiles);
    return () => window.removeEventListener("pi:attach-files", onAttachFiles);
  }, [addAttachments]);

  const syncTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, LINE_HEIGHT * MAX_ROWS)}px`;
  }, []);

  useEffect(() => {
    syncTextareaHeight();
  }, [syncTextareaHeight]);

  const handleSend = useCallback(async () => {
    if (!canSendWithAttachments(text, attachments)) return;

    const message = buildPromptMessage(text, attachments);
    const images = attachmentsToRpcImages(attachments);
    const rpcImages = images.length > 0 ? images : undefined;

    if (isStreaming) {
      useAgentStore.getState().appendSteeringMessage(message);
      try {
        await steer(message, rpcImages);
      } catch (err) {
        console.error("steer failed:", err);
      }
    } else {
      addUserMessage(message);
      try {
        await sendPrompt(message, rpcImages);
      } catch (err) {
        console.error("sendPrompt failed:", err);
      }
    }
    setText("");
    setAttachments([]);
    requestAnimationFrame(() => syncTextareaHeight());
  }, [text, attachments, isStreaming, addUserMessage, syncTextareaHeight]);

  const handleAbort = useCallback(async () => {
    try {
      await abortAgent();
    } catch (err) {
      console.error("abort failed:", err);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showSlashMenu) return;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape" && isStreaming) {
        e.preventDefault();
        handleAbort();
      }
    },
    [handleSend, handleAbort, isStreaming, showSlashMenu],
  );

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    if (value.startsWith("/") && !value.includes("\n")) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  }, []);

  const handleSlashSelect = useCallback((replacement: string) => {
    setText(replacement);
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          void fileToAttachment(file).then((attachment) => {
            addAttachments([attachment]);
          });
        }
        return;
      }
    }
  }, [addAttachments]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      e.target.value = "";
      if (files.length === 0) return;
      void filesToAttachments(files).then(addAttachments);
    },
    [addAttachments],
  );

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }, []);

  const canSend = canSendWithAttachments(text, attachments);

  return (
    <div className="chat-composer">
      <div className="chat-composer-inner">
        {showSlashMenu && (
          <SlashCommandMenu
            text={text}
            onSelect={handleSlashSelect}
            onClose={() => setShowSlashMenu(false)}
          />
        )}

        <div className={`chat-composer-card${focused ? " is-focused" : ""}`}>
          <AttachmentPreview
            attachments={attachments}
            onRemove={handleRemoveAttachment}
          />

          <div className="chat-composer-row">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                handleTextChange(e.target.value);
                syncTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                isStreaming
                  ? "Steer the agent…"
                  : "Message Pi… (type / for commands)"
              }
              rows={1}
              className="chat-composer-input"
            />

            <div className="chat-composer-actions">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={FILE_ACCEPT}
                className="chat-composer-file-input"
                onChange={handleFileInputChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="chat-composer-icon-btn"
                title="Attach image or text file"
              >
                <Paperclip size={15} />
              </button>

              <AnimatePresence mode="wait">
                {isStreaming ? (
                  <motion.div
                    key="streaming"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="chat-composer-stream-actions"
                  >
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!canSend}
                      className="chat-composer-steer-btn"
                    >
                      <CornerDownLeft size={12} />
                      Steer
                    </button>
                    <button
                      type="button"
                      onClick={handleAbort}
                      className="chat-composer-icon-btn"
                      title="Abort (Esc)"
                    >
                      <Square size={12} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="send"
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`chat-composer-send${canSend ? " is-ready" : ""}`}
                    title="Send (Enter)"
                  >
                    <Send size={13} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="chat-composer-hint">
          {isStreaming
            ? "Type to steer · Esc to abort"
            : "Enter to send · Shift+Enter for newline · / for commands · paste or attach files"}
        </p>
      </div>
    </div>
  );
}
