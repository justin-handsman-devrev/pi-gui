import { Group, Panel, Separator } from "react-resizable-panels";
import { useUIStore } from "@/stores/uiStore";
import { useAgentEvents } from "@/hooks/useAgentEvents";
import { useCanvasSync } from "@/hooks/useCanvasSync";
import ChatView from "@/components/ChatView";
import PromptInput from "@/components/PromptInput";
import StatusBar from "@/components/StatusBar";
import CanvasPane from "@/canvas/CanvasPane";

export default function App() {
  // Wire up Tauri event listeners
  useAgentEvents();
  // Bridge tool events to canvas store
  useCanvasSync();

  const canvasVisible = useUIStore((s) => s.canvasVisible);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1117] text-[#e6edf3]">
      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        <Group
          orientation="horizontal"
          id="pi-gui-main"
          style={{ height: "100%", width: "100%" }}
        >
          {/* Chat pane */}
          <Panel
            id="chat"
            defaultSize={canvasVisible ? 50 : 100}
            minSize={25}
            className="flex flex-col min-w-0"
          >
            <ChatView />
            <PromptInput />
          </Panel>

          {/* Resize handle — only when canvas is visible */}
          {canvasVisible && (
            <Separator className="w-px bg-[#21262d] hover:bg-[#58a6ff] active:bg-[#58a6ff] transition-colors" />
          )}

          {/* Canvas pane */}
          {canvasVisible && (
            <Panel
              id="canvas"
              defaultSize={50}
              minSize={20}
              className="flex flex-col min-w-0"
            >
              <CanvasPane />
            </Panel>
          )}
        </Group>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
