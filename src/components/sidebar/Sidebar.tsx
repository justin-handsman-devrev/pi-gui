import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Clock,
} from "lucide-react";
import { newSession } from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import NavSection from "./NavSection";
import ProjectList from "./ProjectList";
import SidebarFooter from "./SidebarFooter";

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const sidebarView = useUIStore((s) => s.sidebarView);
  const [recentExpanded, setRecentExpanded] = useState(true);
  const isStreaming = useAgentStore((s) => s.isStreaming);

  const handleNewChat = useCallback(async () => {
    if (isStreaming) return;
    try {
      const result = await newSession();
      if (!result.cancelled) {
        useAgentStore.getState().reset();
      }
    } catch (err) {
      console.error("[Sidebar] new session failed:", err);
    }
  }, [isStreaming]);

  return (
    <>
      {/* Expand tab — visible when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-3 top-3 z-50 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-all duration-150 ease-out hover:bg-zinc-800 hover:text-zinc-300"
          title="Open sidebar"
        >
          <PanelLeft size={16} />
        </button>
      )}

      {/* Sidebar panel */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
            className="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-zinc-900"
          >
            {/* Fixed-width inner content prevents layout shift during animation */}
            <div className="flex h-full w-[260px] flex-col overflow-hidden">
              {/* ── Header ─────────────────────────────────────────── */}
              <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 px-3 py-3">
                {/* Logo */}
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 text-[13px] font-bold text-white">
                  π
                </div>
                <span className="flex-1 text-[13px] font-semibold text-zinc-100">
                  Pi GUI
                </span>

                {/* Collapse button */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-all duration-150 ease-out hover:bg-zinc-800 hover:text-zinc-300"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>

              {/* ── New Chat Button ────────────────────────────────── */}
              <div className="shrink-0 px-3 pt-3 pb-1">
                <button
                  onClick={handleNewChat}
                  disabled={isStreaming}
                  className="
                    flex w-full items-center justify-center gap-1.5 rounded-lg
                    bg-gradient-to-r from-violet-600 to-indigo-600
                    px-3 py-2 text-[13px] font-medium text-white
                    shadow-sm shadow-violet-500/20
                    transition-all duration-150 ease-out
                    hover:from-violet-500 hover:to-indigo-500
                    hover:shadow-md hover:shadow-violet-500/30
                    active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    disabled:active:scale-100
                  "
                >
                  <Plus size={14} strokeWidth={2.5} />
                  New Chat
                </button>
              </div>

              {/* ── Navigation ─────────────────────────────────────── */}
              <div className="shrink-0 pt-2 pb-1">
                <NavSection />
              </div>

              {/* ── Divider ────────────────────────────────────────── */}
              <div className="mx-3 shrink-0 border-t border-zinc-800" />

              {/* ── Recent Section (scrollable) ─────────────────────── */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {/* Section header */}
                <button
                  onClick={() => setRecentExpanded((v) => !v)}
                  className="group flex shrink-0 items-center gap-1.5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors duration-150 hover:text-zinc-400"
                >
                  <motion.span
                    animate={{ rotate: recentExpanded ? 0 : -90 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: "flex" }}
                  >
                    <ChevronDown size={12} />
                  </motion.span>
                  Recent
                </button>

                {/* Section body */}
                <AnimatePresence initial={false}>
                  {recentExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2"
                    >
                      {sidebarView === "chats" || sidebarView === "projects" ? (
                        <ProjectList />
                      ) : sidebarView === "settings" ? (
                        <SettingsInline />
                      ) : sidebarView === "scheduled" ? (
                        <ScheduledPlaceholder />
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Footer ─────────────────────────────────────────── */}
              <SidebarFooter />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Inline settings controls ────────────────────────────────────────────── */

function SettingsInline() {
  const settings = useUIStore((s) => s.settings);
  const updateSettings = useUIStore((s) => s.updateSettings);

  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      <SettingToggle
        label="Line numbers"
        checked={settings.showLineNumbers}
        onChange={(v) => updateSettings({ showLineNumbers: v })}
      />
      <SettingToggle
        label="Auto-open canvas"
        checked={settings.canvasAutoOpen}
        onChange={(v) => updateSettings({ canvasAutoOpen: v })}
      />
      <SettingToggle
        label="Compact messages"
        checked={settings.compactMessages}
        onChange={(v) => updateSettings({ compactMessages: v })}
      />

      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] text-zinc-400">Font size</span>
        <span className="font-mono text-[12px] tabular-nums text-zinc-300">
          {settings.fontSize}px
        </span>
      </div>
      <input
        type="range"
        min={10}
        max={20}
        value={settings.fontSize}
        onChange={(e) =>
          updateSettings({ fontSize: Number(e.target.value) })
        }
        className="w-full accent-violet-500"
      />
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function SettingToggle({ label, checked, onChange }: SettingToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-md px-1 py-1 transition-colors duration-150 hover:bg-zinc-800"
    >
      <span className="text-[12px] text-zinc-400">{label}</span>
      <span
        className={`
          flex h-4 w-7 items-center rounded-full p-0.5
          transition-colors duration-150
          ${checked ? "bg-violet-500" : "bg-zinc-700"}
        `}
      >
        <motion.span
          animate={{ x: checked ? 12 : 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="h-3 w-3 rounded-full bg-white"
        />
      </span>
    </button>
  );
}

/* ── Scheduled placeholder ──────────────────────────────────────────────── */

function ScheduledPlaceholder() {
  return (
    <div className="px-4 py-6 text-center">
      <Clock size={24} className="mx-auto mb-2 text-zinc-600" />
      <p className="text-xs text-zinc-500">No scheduled tasks</p>
      <p className="mt-0.5 text-[11px] text-zinc-600">
        Automations will appear here
      </p>
    </div>
  );
}
