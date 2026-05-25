import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Minimize2, Trash2, HelpCircle, Command } from "lucide-react";
import { compactSession } from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useNotificationStore } from "@/stores/notificationStore";

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function SlashCommandMenu({
  text,
  onSelect,
  onClose,
}: {
  text: string;
  onSelect: (replacement: string) => void;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const commands: SlashCommand[] = [
    {
      id: "compact",
      label: "/compact",
      description: "Compact the conversation context",
      icon: <Minimize2 size={14} />,
      action: async () => {
        try {
          const result = await compactSession();
          if (result.success) {
            addNotification({ type: "success", title: "Session compacted", message: result.message });
          } else {
            addNotification({ type: "warning", title: "Compaction failed", message: result.message });
          }
        } catch {
          addNotification({ type: "error", title: "Compaction error" });
        }
      },
    },
    {
      id: "clear",
      label: "/clear",
      description: "Clear the conversation history",
      icon: <Trash2 size={14} />,
      action: () => {
        useAgentStore.getState().reset();
        addNotification({ type: "info", title: "Conversation cleared" });
      },
    },
    {
      id: "model",
      label: "/model",
      description: "Change the active model",
      icon: <Sparkles size={14} />,
      action: () => {
        useUIStore.getState().setSettingsOpen(true);
        // Navigate to model tab handled by settings panel
        addNotification({ type: "info", title: "Opening model settings" });
      },
    },
    {
      id: "help",
      label: "/help",
      description: "Show keyboard shortcuts and commands",
      icon: <HelpCircle size={14} />,
      action: () => {
        window.dispatchEvent(new CustomEvent("pi:toggle-shortcuts"));
      },
    },
    {
      id: "commands",
      label: "/commands",
      description: "Open the command palette",
      icon: <Command size={14} />,
      action: () => {
        window.dispatchEvent(new CustomEvent("pi:command-palette"));
      },
    },
  ];

  const query = text.startsWith("/") ? text.toLowerCase() : "";
  const filtered = commands.filter(
    (c) => !query || c.label.startsWith(query) || c.description.toLowerCase().includes(query.slice(1)),
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[selectedIndex];
        if (cmd) {
          cmd.action();
          onSelect("");
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.12 }}
        className="absolute bottom-full left-0 right-0 mb-2 z-50"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-hover)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "8px" }}>
          <div
            className="type-label"
            style={{
              padding: "8px 12px",
              fontSize: 10,
              color: "var(--muted-soft)",
            }}
          >
            Commands
          </div>
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => {
                cmd.action();
                onSelect("");
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              className="flex w-full items-center gap-3"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--r-md)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                background: i === selectedIndex ? "var(--surface-strong)" : "transparent",
                transition: "background 0.1s",
              }}
            >
              <span
                className="flex items-center justify-center"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "var(--r-sm)",
                  background: i === selectedIndex ? "var(--canvas)" : "var(--surface-strong)",
                  color: i === selectedIndex ? "var(--ink)" : "var(--muted)",
                  flexShrink: 0,
                }}
              >
                {cmd.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                  {cmd.label}
                </div>
                <div className="mt-1" style={{ fontSize: 12, color: "var(--muted)" }}>
                  {cmd.description}
                </div>
              </div>
              {i === selectedIndex && (
                <ChevronRight size={13} style={{ color: "var(--muted-soft)", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
