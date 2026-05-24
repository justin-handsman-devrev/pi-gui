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
          className="absolute left-3 top-3 z-50 flex h-7 w-7 items-center justify-center rounded-md text-[#78716c] transition-all duration-150 ease-out hover:bg-[#44403c]/30 hover:text-[#a8a29e]"
          title="Open sidebar"
        >
          <PanelLeft size={16} />
        </button>
      )}

      {/* Sidebar panel */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex h-full w-[260px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#1c1917]"
          >
            {/* Fixed-width inner content */}
            <div className="flex h-full w-full flex-col overflow-hidden">
              {/* ── Header ─────────────────────────────────────────── */}
              <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-3">
                {/* Logo */}
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#292524] text-[13px] font-medium text-white">
                  π
                </div>
                <span className="flex-1 text-[15px] font-medium tracking-[0.15px] text-[#fafaf9]">
                  Pi GUI
                </span>

                {/* Collapse button */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[#78716c] transition-all duration-150 ease-out hover:bg-[#44403c]/30 hover:text-[#a8a29e]"
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
                    flex w-full items-center justify-center gap-1.5 rounded-full
                    h-[40px] px-5
                    bg-[#292524] text-white
                    text-[14px] font-medium
                    transition-all duration-150 ease-out
                    hover:bg-[#44403c]
                    active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    disabled:active:scale-100
                  "
                >
                  <Plus size={14} strokeWidth={2} />
                  New Chat
                </button>
              </div>

              {/* ── Navigation ─────────────────────────────────────── */}
              <div className="shrink-0 pt-2 pb-1">
                <NavSection />
              </div>

              {/* ── Divider ────────────────────────────────────────── */}
              <div className="mx-3 shrink-0 border-t border-white/[0.06]" />

              {/* ── Recent Section (scrollable) ─────────────────────── */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {/* Section header */}
                <button
                  onClick={() => setRecentExpanded((v) => !v)}
                  className="group flex shrink-0 items-center gap-1.5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#78716c] transition-colors duration-150 hover:text-[#a8a29e]"
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
        <span className="text-[12px] text-[#a8a29e]">Font size</span>
        <span className="font-mono text-[12px] tabular-nums text-[#fafaf9]">
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
        className="w-full accent-[#9d8bb8]"
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
      className="flex items-center justify-between rounded-md px-1 py-1 transition-colors duration-150 hover:bg-[#44403c]/30"
    >
      <span className="text-[12px] text-[#a8a29e]">{label}</span>
      <span
        className={`
          flex h-4 w-7 items-center rounded-full p-0.5
          transition-colors duration-150 ease-out
          ${checked ? "bg-[#5fb8a3]" : "bg-[#44403c]"}
        `}
      >
        <motion.span
          animate={{ x: checked ? 12 : 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="h-3 w-3 rounded-full bg-white shadow-sm"
        />
      </span>
    </button>
  );
}

/* ── Scheduled placeholder ──────────────────────────────────────────────── */

function ScheduledPlaceholder() {
  return (
    <div className="px-4 py-6 text-center">
      <Clock size={24} className="mx-auto mb-2 text-[#57534e]" />
      <p className="text-xs text-[#78716c]">No scheduled tasks</p>
      <p className="mt-0.5 text-[11px] text-[#57534e]">
        Automations will appear here
      </p>
    </div>
  );
}
