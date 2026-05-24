import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import GeneralTab from "./GeneralTab";
import ModelTab from "./ModelTab";
import SkillsTab from "./SkillsTab";
import McpTab from "./McpTab";
import AboutTab from "./AboutTab";

type TabId = "general" | "model" | "skills" | "mcp" | "about";

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: "general", label: "General" },
  { id: "model", label: "Model & AI" },
  { id: "skills", label: "Skills" },
  { id: "mcp", label: "MCP" },
  { id: "about", label: "About" },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.2, ease: "easeInOut" as const },
  },
};

export default function SettingsPanel() {
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const close = useCallback(() => setSettingsOpen(false), [setSettingsOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [settingsOpen, close]);

  // Reset tab when panel opens
  useEffect(() => {
    if (settingsOpen) setActiveTab("general");
  }, [settingsOpen]);

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[600px] flex-col border-l border-[var(--border-default)] bg-zinc-900 shadow-2xl"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label="Settings"
            data-tauri-drag-region="false"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-50">Settings</h2>
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] px-6 py-2">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150
                      ${
                        isActive
                          ? "bg-violet-500/15 text-violet-400"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                      }
                    `}
                    role="tab"
                    aria-selected={isActive}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="settings-tab-indicator"
                        className="absolute inset-0 rounded-full bg-violet-500/15"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="p-6"
                >
                  {activeTab === "general" && <GeneralTab />}
                  {activeTab === "model" && <ModelTab />}
                  {activeTab === "skills" && <SkillsTab />}
                  {activeTab === "mcp" && <McpTab />}
                  {activeTab === "about" && <AboutTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
