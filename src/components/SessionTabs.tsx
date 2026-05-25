import { useState, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { useSessionHistoryStore } from "@/stores/sessionHistoryStore";

interface Tab {
  id: string;
  name: string;
}

export default function SessionTabs() {
  const sessionId = useAgentStore((s) => s.sessionId);
  const sessionName = useAgentStore((s) => s.sessionName);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  // Sync current session as a tab
  useState(() => {
    if (!sessionId) return;
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === sessionId);
      if (existing) {
        return prev.map((t) =>
          t.id === sessionId ? { ...t, name: sessionName || existing.name } : t,
        );
      }
      return [...prev, { id: sessionId, name: sessionName || `Chat ${prev.length + 1}` }];
    });
    setActiveTabId(sessionId);
  });

  const handleDoubleClick = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      setRenaming(tabId);
      setRenameValue(tab.name);
    }
  }, [tabs]);

  const renameSession = useSessionHistoryStore((s) => s.renameSession);

  const handleRenameSubmit = useCallback(() => {
    if (renaming && renameValue.trim()) {
      const trimmed = renameValue.trim();
      setTabs((prev) =>
        prev.map((t) =>
          t.id === renaming ? { ...t, name: trimmed } : t,
        ),
      );
      renameSession(renaming, trimmed);
    }
    setRenaming(null);
  }, [renaming, renameValue, renameSession]);

  const handleNewTab = useCallback(() => {
    window.dispatchEvent(new CustomEvent("pi:new-session"));
  }, []);

  if (tabs.length <= 1) return null;

  return (
    <div className="session-tabs-bar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isRenaming = tab.id === renaming;

        return (
          <div
            key={tab.id}
            className={`session-tab${isActive ? " is-active" : ""}`}
            onClick={() => setActiveTabId(tab.id)}
            onDoubleClick={() => handleDoubleClick(tab.id)}
          >
            {isRenaming ? (
              <input
                ref={renameRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") setRenaming(null);
                }}
                className="session-tab-rename"
              />
            ) : (
              <span className="truncate">{tab.name}</span>
            )}
          </div>
        );
      })}

      <button
        onClick={handleNewTab}
        className="session-tab-new"
        title="New session (⌘N)"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
