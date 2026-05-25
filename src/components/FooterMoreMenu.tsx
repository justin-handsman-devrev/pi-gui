import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ellipsis, FileJson, FileText } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { useNotificationStore } from "@/stores/notificationStore";

export default function FooterMoreMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const messages = useAgentStore((s) => s.messages);
  const sessionName = useAgentStore((s) => s.sessionName);
  const model = useAgentStore((s) => s.model);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const canExport = messages.length > 0;

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const exportMarkdown = useCallback(() => {
    if (!canExport) return;
    const lines: string[] = [
      `# ${sessionName || "Pi Chat Export"}`,
      "",
      `Exported: ${new Date().toLocaleString()}`,
      model ? `Model: ${model.provider}/${model.id}` : "",
      "",
      "---",
      "",
    ];
    for (const msg of messages) {
      lines.push(`### ${msg.role === "user" ? "**You**" : "**Pi**"}`, "", msg.content, "");
    }
    downloadBlob(
      new Blob([lines.join("\n")], { type: "text/markdown" }),
      `${(sessionName || "chat").replace(/\s+/g, "-")}.md`,
    );
    addNotification({ type: "success", title: "Exported as Markdown" });
    setOpen(false);
  }, [canExport, messages, sessionName, model, addNotification]);

  const exportJSON = useCallback(() => {
    if (!canExport) return;
    const data = {
      sessionName,
      model,
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
      })),
    };
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      `${(sessionName || "chat").replace(/\s+/g, "-")}.json`,
    );
    addNotification({ type: "success", title: "Exported as JSON" });
    setOpen(false);
  }, [canExport, messages, sessionName, model, addNotification]);

  if (!canExport) return null;

  return (
    <div className="footer-more" ref={menuRef}>
      <button
        type="button"
        className="app-footer-icon-btn"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Export chat"
      >
        <Ellipsis size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="footer-more-menu"
            role="menu"
          >
            <div className="footer-more-section">
              <span className="footer-more-label">Export</span>
              <button type="button" className="footer-more-item" role="menuitem" onClick={exportMarkdown}>
                <FileText size={13} />
                Markdown
              </button>
              <button type="button" className="footer-more-item" role="menuitem" onClick={exportJSON}>
                <FileJson size={13} />
                JSON
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
