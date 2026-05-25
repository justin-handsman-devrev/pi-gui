import { motion, AnimatePresence } from "framer-motion";
import { FileText, X } from "lucide-react";
import type { PromptAttachment } from "@/lib/prompt-attachments";

interface AttachmentPreviewProps {
  attachments: PromptAttachment[];
  onRemove: (id: string) => void;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AttachmentPreview({
  attachments,
  onRemove,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="chat-composer-attachments">
      <AnimatePresence initial={false}>
        {attachments.map((attachment) => (
          <motion.div
            key={attachment.id}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.16 }}
            className={`chat-attachment-item${
              attachment.kind === "text" ? " is-file" : " is-image"
            }`}
          >
            {attachment.kind === "image" && attachment.dataUrl ? (
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="chat-attachment-thumb"
              />
            ) : (
              <div className="chat-attachment-file-icon" aria-hidden="true">
                <FileText size={18} />
              </div>
            )}

            <div className="chat-attachment-meta">
              <span className="chat-attachment-name">{attachment.name}</span>
              <span className="chat-attachment-size">
                {formatSize(attachment.size)}
              </span>
            </div>

            <button
              type="button"
              className="chat-attachment-remove"
              onClick={() => onRemove(attachment.id)}
              title={`Remove ${attachment.name}`}
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
