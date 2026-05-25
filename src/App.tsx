import { useState, useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useAgentEvents } from "@/hooks/useAgentEvents";
import { useCanvasSync } from "@/hooks/useCanvasSync";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Sidebar from "@/components/sidebar/Sidebar";
import SettingsPanel from "@/components/settings/SettingsPanel";
import CanvasPane from "@/canvas/CanvasPane";
import NotificationToasts from "@/components/NotificationToasts";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcutsOverlay from "@/components/KeyboardShortcutsOverlay";
import AppFooter from "@/components/AppFooter";
import CanvasToggle from "@/components/CanvasToggle";
import MainPanel from "@/components/extensions/MainPanel";
import StartupScreen from "@/components/startup/StartupScreen";
import { useSessionHistorySync } from "@/hooks/useSessionHistorySync";
import { useApplySettings } from "@/hooks/useApplySettings";

export default function App() {
  useAgentEvents();
  useCanvasSync();
  useSessionHistorySync();
  useApplySettings();
  const shortcuts = useKeyboardShortcuts();

  const canvasVisible = useUIStore((s) => s.canvasVisible);
  const sidebarView = useUIStore((s) => s.sidebarView);
  const showCanvasToggle = !canvasVisible && sidebarView !== "extensions";

  const [agentStarted, setAgentStarted] = useState(false);

  const model = useAgentStore((s) => s.model);
  const sessionName = useAgentStore((s) => s.sessionName);

  useEffect(() => {
    const parts: string[] = [];
    if (sessionName) parts.push(sessionName);
    if (model) {
      const short = model.id.replace(/-\d{8}$/, "").split("/").pop() ?? model.id;
      parts.push(short);
    }
    document.title = parts.length > 0 ? `${parts.join(" · ")} — Pi` : "Pi";
  }, [model, sessionName]);

  if (!agentStarted) {
    return <StartupScreen onStarted={() => setAgentStarted(true)} />;
  }

  return (
    <div className="el-app flex h-screen flex-col overflow-hidden">
      <div className="el-app-scaled flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="el-app-shell">
          <Sidebar />

          <div className="el-main-stage">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <Group
                orientation="horizontal"
                id="pi-gui-main"
                className="min-h-0 flex-1"
                style={{ height: "100%", width: "100%" }}
              >
                <Panel id="chat" defaultSize={canvasVisible ? 55 : 100} minSize={25} className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
                  {showCanvasToggle && <CanvasToggle />}
                  <MainPanel />
                </Panel>

                {canvasVisible && <Separator className="resize-handle" style={{ width: 1, background: "transparent" }} />}

                {canvasVisible && (
                  <Panel id="canvas" defaultSize={45} minSize={24} className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                    <CanvasPane />
                  </Panel>
                )}
              </Group>
            </div>
          </div>
        </div>

        <AppFooter />
      </div>
      <SettingsPanel />

      <NotificationToasts />
      <CommandPalette />
      <KeyboardShortcutsOverlay shortcuts={shortcuts} />
    </div>
  );
}
