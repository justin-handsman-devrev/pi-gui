import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Blocks,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { compactSession } from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  fetchPiSlashCommands,
  groupSlashCommands,
  matchesSlashQuery,
  piCommandToMenuItem,
  type LocalSlashCommand,
  type SlashMenuCommand,
} from "@/lib/slash-commands";

function sourceIcon(source: SlashMenuCommand["source"]) {
  switch (source) {
    case "skill":
      return <Wand2 size={14} />;
    case "prompt":
      return <FileText size={14} />;
    case "extension":
      return <Blocks size={14} />;
    default:
      return <Sparkles size={14} />;
  }
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
  const [piCommands, setPiCommands] = useState<SlashMenuCommand[]>([]);
  const [loadingPi, setLoadingPi] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const localCommands = useMemo<LocalSlashCommand[]>(() => [
    {
      kind: "local",
      id: "compact",
      label: "/compact",
      description: "Compact the conversation context",
      source: "app",
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
      kind: "local",
      id: "clear",
      label: "/clear",
      description: "Clear the conversation history",
      source: "app",
      action: () => {
        useAgentStore.getState().reset();
        addNotification({ type: "info", title: "Conversation cleared" });
      },
    },
    {
      kind: "local",
      id: "model",
      label: "/model",
      description: "Change the active model",
      source: "app",
      action: () => {
        useUIStore.getState().setSettingsOpen(true);
        addNotification({ type: "info", title: "Opening model settings" });
      },
    },
    {
      kind: "local",
      id: "help",
      label: "/help",
      description: "Show keyboard shortcuts and commands",
      source: "app",
      action: () => {
        window.dispatchEvent(new CustomEvent("pi:toggle-shortcuts"));
      },
    },
    {
      kind: "local",
      id: "commands",
      label: "/commands",
      description: "Open the command palette",
      source: "app",
      action: () => {
        window.dispatchEvent(new CustomEvent("pi:command-palette"));
      },
    },
  ], [addNotification]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPi(true);

    void fetchPiSlashCommands().then((commands) => {
      if (cancelled) return;
      setPiCommands(commands.map(piCommandToMenuItem));
      setLoadingPi(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const query = text.startsWith("/") ? text : "";
  const allCommands = useMemo(
    () => [...piCommands, ...localCommands],
    [piCommands, localCommands],
  );

  const filtered = useMemo(
    () => allCommands.filter((command) => matchesSlashQuery(command.label, query)),
    [allCommands, query],
  );

  const groups = useMemo(() => groupSlashCommands(filtered), [filtered]);

  const flatItems = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, flatItems.length]);

  const runCommand = useCallback((command: SlashMenuCommand) => {
    if (command.kind === "pi") {
      onSelect(`/${command.name}`);
      onClose();
      return;
    }
    command.action();
    onSelect("");
    onClose();
  }, [onClose, onSelect]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (flatItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((index) => (index + 1) % flatItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((index) => (index - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const command = flatItems[selectedIndex];
        if (command) runCommand(command);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const command = flatItems[selectedIndex];
        if (command) runCommand(command);
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [flatItems, selectedIndex, onClose, runCommand]);

  if (loadingPi && filtered.length === 0) {
    return (
      <div className="slash-command-menu" aria-busy="true">
        <div className="slash-command-loading">
          <Loader2 size={14} className="animate-spin" />
          Loading commands…
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="slash-command-menu">
        <div className="slash-command-empty">
          No commands match <code>{query || "/"}</code>
        </div>
      </div>
    );
  }

  let itemIndex = -1;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.12 }}
        className="slash-command-menu"
      >
        {groups.map((group) => (
          <div key={group.id} className="slash-command-group">
            <div className="slash-command-group-label">{group.label}</div>
            {group.items.map((command) => {
              itemIndex += 1;
              const selected = itemIndex === selectedIndex;

              return (
                <button
                  key={command.id}
                  type="button"
                  onClick={() => runCommand(command)}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                  className={`slash-command-item${selected ? " is-selected" : ""}`}
                >
                  <span className="slash-command-item-icon">
                    {sourceIcon(command.source)}
                  </span>
                  <div className="slash-command-item-copy">
                    <div className="slash-command-item-label">{command.label}</div>
                    <div className="slash-command-item-desc">{command.description}</div>
                  </div>
                  {selected && (
                    <ChevronRight size={13} className="slash-command-item-chevron" />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {loadingPi && (
          <div className="slash-command-loading subtle">
            <Loader2 size={12} className="animate-spin" />
            Refreshing Pi commands…
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
