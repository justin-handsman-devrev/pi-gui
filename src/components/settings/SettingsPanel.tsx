import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Gauge, Info, Settings2, X } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import GeneralTab from "./GeneralTab";
import ModelTab from "./ModelTab";
import UsageTab from "./UsageTab";
import AboutTab from "./AboutTab";

type TabId = "general" | "model" | "usage" | "about";

interface TabDef {
  id: TabId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  {
    id: "general",
    label: "General",
    description: "Appearance and editor",
    icon: <Settings2 size={15} strokeWidth={1.75} />,
  },
  {
    id: "model",
    label: "Model & AI",
    description: "Models and reasoning",
    icon: <Cpu size={15} strokeWidth={1.75} />,
  },
  {
    id: "usage",
    label: "Usage",
    description: "Tokens and cost",
    icon: <Gauge size={15} strokeWidth={1.75} />,
  },
  {
    id: "about",
    label: "About",
    description: "App info and system",
    icon: <Info size={15} strokeWidth={1.75} />,
  },
];

export default function SettingsPanel() {
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const close = useCallback(() => setSettingsOpen(false), [setSettingsOpen]);
  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [settingsOpen, close]);

  useEffect(() => {
    if (settingsOpen) setActiveTab("general");
  }, [settingsOpen]);

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          <motion.button
            type="button"
            className="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-label="Close settings"
          />

          <motion.aside
            className="settings-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            role="dialog"
            aria-label="Settings"
          >
            <div className="settings-panel-bg" aria-hidden="true">
              <div className="orb orb-lavender settings-panel-orb settings-panel-orb-a" />
              <div className="orb orb-peach settings-panel-orb settings-panel-orb-b" />
            </div>

            <header className="settings-panel-top">
              <div className="settings-panel-top-copy">
                <h2 className="settings-panel-title">Settings</h2>
                <p className="settings-panel-subtitle">{active.description}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="ext-icon-btn"
                aria-label="Close settings"
              >
                <X size={15} />
              </button>
            </header>

            <div className="settings-panel-shell">
              <nav className="settings-nav" aria-label="Settings sections">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`settings-nav-item${isActive ? " is-active" : ""}`}
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="settings-nav-icon">{tab.icon}</span>
                      <span className="settings-nav-copy">
                        <span className="settings-nav-label">{tab.label}</span>
                        <span className="settings-nav-desc">{tab.description}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="settings-content">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    className="settings-content-inner"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                  >
                    {activeTab === "general" && <GeneralTab />}
                    {activeTab === "model" && <ModelTab />}
                    {activeTab === "usage" && <UsageTab />}
                    {activeTab === "about" && <AboutTab />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
