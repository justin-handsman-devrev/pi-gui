import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Settings, MessageSquare, PanelLeft, Minimize2, FileCode } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";

interface PaletteAction {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const actions: PaletteAction[] = [
    {
      id: "new-session",
      label: "New Session",
      category: "Session",
      icon: <Plus size={14} />,
      action: () => {
        window.dispatchEvent(new CustomEvent("pi:new-session"));
      },
    },
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      category: "View",
      icon: <PanelLeft size={14} />,
      action: toggleSidebar,
    },
    {
      id: "open-settings",
      label: "Open Settings",
      category: "Settings",
      icon: <Settings size={14} />,
      action: () => setSettingsOpen(true),
    },
    {
      id: "compact-session",
      label: "Compact Session",
      category: "Session",
      icon: <Minimize2 size={14} />,
      action: () => {
        window.dispatchEvent(new CustomEvent("pi:compact"));
      },
    },
    {
      id: "clear-chat",
      label: "Clear Chat",
      category: "Session",
      icon: <X2 size={14} />,
      action: () => {
        useAgentStore.getState().reset();
      },
    },
    {
      id: "open-canvas",
      label: "Open Canvas",
      category: "View",
      icon: <FileCode size={14} />,
      action: () => useUIStore.getState().setCanvasVisible(true),
    },
    {
      id: "focus-chat",
      label: "Focus Chat Input",
      category: "Navigation",
      icon: <MessageSquare size={14} />,
      action: () => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(),
    },
    {
      id: "search-sessions",
      label: "Search Sessions",
      category: "Search",
      icon: <Search size={14} />,
      action: () => window.dispatchEvent(new CustomEvent("pi:search-focus")),
    },
  ];

  const lower = query.toLowerCase();
  const filtered = actions.filter(
    (a) => !query || a.label.toLowerCase().includes(lower) || a.category.toLowerCase().includes(lower),
  );

  useEffect(() => {
    const openPalette = () => {
      setOpen(true);
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    const closePalette = () => setOpen(false);

    window.addEventListener("pi:command-palette", openPalette);
    window.addEventListener("pi:escape", closePalette);

    return () => {
      window.removeEventListener("pi:command-palette", openPalette);
      window.removeEventListener("pi:escape", closePalette);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const action = filtered[selectedIndex];
        if (action) {
          action.action();
          setOpen(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, filtered, selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="command-palette-root">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="command-palette-backdrop"
            onClick={() => setOpen(false)}
          />
          <div className="command-palette-stage">
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="command-palette-panel"
            >
            {/* Search input */}
            <div
              className="flex items-center gap-3"
              style={{ padding: "12px 16px", borderBottom: "1px solid var(--hairline)" }}
            >
              <Search size={16} style={{ color: "var(--muted-soft)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command…"
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  color: "var(--ink)",
                  border: "none",
                  letterSpacing: "0.15px",
                }}
              />
              <kbd
                className="font-mono"
                style={{
                  background: "var(--surface-strong)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--r-xs)",
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--muted-soft)",
                }}
              >
                esc
              </kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 340, overflowY: "auto", padding: "var(--sp-2)" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "var(--sp-5)", textAlign: "center", color: "var(--muted-soft)", fontSize: 13 }}>
                  No matching commands
                </div>
              ) : (
                filtered.map((action, i) => {
                  const selected = i === selectedIndex;
                  const prevCat = i > 0 ? filtered[i - 1].category : null;
                  const showCatSep = action.category !== prevCat;
                  return (
                    <div key={action.id}>
                      {showCatSep && i > 0 && (
                        <div style={{ height: 1, background: "var(--hairline-soft)", margin: "var(--sp-1) var(--sp-3)" }} />
                      )}
                      <button
                        onClick={() => {
                          action.action();
                          setOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className="flex w-full items-center gap-3"
                        style={{
                          padding: "8px 12px",
                          borderRadius: "var(--r-md)",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          background: selected ? "var(--surface-strong)" : "transparent",
                          transition: "background var(--t-fast)",
                        }}
                      >
                        <span
                          className="flex items-center justify-center"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "var(--r-sm)",
                            background: selected ? "var(--canvas)" : "var(--surface-strong)",
                            color: selected ? "var(--ink)" : "var(--muted)",
                            flexShrink: 0,
                            transition: "all var(--t-fast)",
                          }}
                        >
                          {action.icon}
                        </span>
                        <span style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
                          {action.label}
                        </span>
                        <span className="flex-1" />
                        <span
                          className="type-label"
                          style={{ fontSize: 10, color: selected ? "var(--muted)" : "var(--muted-soft)", transition: "color var(--t-fast)" }}
                        >
                          {action.category}
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function X2({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
