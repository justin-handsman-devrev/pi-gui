import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  PanelLeftClose,
  Settings,
} from "lucide-react";
import { newSession, getState, getMessages } from "@/lib/tauri-commands";
import { mapAgentMessages } from "@/lib/session-messages";
import { syncAgentQueuesFromState } from "@/lib/sync-agent-queues";
import { refreshSessionStats } from "@/lib/session-stats";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore, type SidebarView } from "@/stores/uiStore";
import NavSection from "./NavSection";
import ProjectList from "./ProjectList";
import ChatList from "./ChatList";
import ActivityView from "./ActivityView";
import ScheduledView from "./ScheduledView";
import ExtensionsView from "./ExtensionsView";
import SessionSearch from "../SessionSearch";

const SECTION_LABELS: Record<SidebarView, string> = {
  chats: "Recent chats",
  projects: "Projects",
  scheduled: "Scheduled",
  activity: "Activity",
  extensions: "Extensions",
  settings: "Settings",
};

const DEFAULT_WIDTH = 280;

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const sidebarView = useUIStore((s) => s.sidebarView);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);

  const handleNewChat = useCallback(async () => {
    if (isStreaming) return;
    try {
      const result = await newSession();
      if (result.cancelled) return;

      const [state, messagesData] = await Promise.all([getState(), getMessages()]);
      const messages = mapAgentMessages(messagesData);
      useAgentStore.getState().loadSession({
        sessionId: state.sessionId,
        sessionName: state.sessionName,
        sessionFile: state.sessionFile,
        model: state.model,
        thinkingLevel: state.thinkingLevel,
        messages,
      });
      syncAgentQueuesFromState(state as unknown as Record<string, unknown>);
      void refreshSessionStats();
    } catch (err) {
      console.error("[Sidebar] new session failed:", err);
    }
  }, [isStreaming]);

  useEffect(() => {
    const handler = () => handleNewChat();
    window.addEventListener("pi:new-session", handler);
    return () => window.removeEventListener("pi:new-session", handler);
  }, [handleNewChat]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - startX;
      setWidth(Math.max(220, Math.min(360, startWidth + delta)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [width]);

  const renderContent = () => {
    switch (sidebarView) {
      case "chats":
        return <ChatList onNewChat={handleNewChat} />;
      case "projects":
        return <ProjectList />;
      case "scheduled":
        return <ScheduledView />;
      case "activity":
        return <ActivityView />;
      case "extensions":
        return <ExtensionsView />;
      case "settings":
        return <SettingsShortcut onOpenSettings={() => setSettingsOpen(true)} />;
      default:
        return null;
    }
  };

  return (
    <>
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="sidebar-icon-btn absolute left-3 top-3 z-50 btn-outline"
          style={{ width: 36, height: 36, padding: 0 }}
          title="Open sidebar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      )}

      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <>
            <motion.aside
              initial={{ x: -DEFAULT_WIDTH, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -DEFAULT_WIDTH, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="sidebar relative shrink-0 overflow-hidden"
              style={{ width }}
            >
              <div className="sidebar-atmosphere" aria-hidden="true">
                <div className="orb orb-lavender sidebar-orb-a" />
                <div className="orb orb-mint sidebar-orb-b" />
              </div>

              <header className="sidebar-header">
                <div className="sidebar-brand">
                  <div className="sidebar-brand-mark">
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 300, color: "var(--on-primary)", lineHeight: 1 }}>
                      π
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="sidebar-brand-title">Pi</div>
                    <div className="sidebar-brand-subtitle">Local coding agent</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="sidebar-icon-btn"
                  title="Settings (⌘,)"
                >
                  <Settings size={15} strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="sidebar-icon-btn"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={15} strokeWidth={1.75} />
                </button>
              </header>

              <div className="sidebar-main">
                {/* Primary action */}
                <div className="sidebar-section">
                  <button
                    type="button"
                    onClick={handleNewChat}
                    disabled={isStreaming}
                    className="sidebar-btn-primary"
                  >
                    <Plus size={14} strokeWidth={2} />
                    New Chat
                  </button>
                </div>

                <div className="sidebar-section">
                  <NavSection />
                </div>

                {(sidebarView === "chats"
                  || sidebarView === "projects"
                  || sidebarView === "activity") && (
                  <SessionSearch />
                )}

                {/* Content list */}
                <div className="sidebar-section flex min-h-0 flex-1 flex-col">
                  <p className="sidebar-section-label">{SECTION_LABELS[sidebarView]}</p>
                  <div className="sidebar-scroll">
                    {renderContent()}
                  </div>
                </div>
              </div>
            </motion.aside>

            <div
              onMouseDown={handleMouseDown}
              className="hover-hairline"
              style={{
                width: 5,
                cursor: "col-resize",
                position: "relative",
                zIndex: 10,
                background: "transparent",
                transition: "background var(--t-normal)",
              }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SettingsShortcut({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="sidebar-empty">
      <div className="sidebar-empty-icon">
        <Settings size={18} strokeWidth={1.5} />
      </div>
      <p className="sidebar-empty-title">App settings</p>
      <p className="sidebar-empty-desc">
        Model, theme, and app preferences.
      </p>
      <button
        type="button"
        onClick={onOpenSettings}
        className="sidebar-btn-primary"
        style={{ width: "auto", marginTop: 4 }}
      >
        Open settings
      </button>
      <p style={{ fontSize: 10, color: "var(--muted-soft)", marginTop: 8 }}>
        Shortcut: ⌘,
      </p>
    </div>
  );
}
