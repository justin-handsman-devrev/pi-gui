import { useState, useCallback } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useAgentEvents } from "@/hooks/useAgentEvents";
import { useCanvasSync } from "@/hooks/useCanvasSync";
import { startAgent, getState } from "@/lib/tauri-commands";
import ChatView from "@/components/ChatView";
import PromptInput from "@/components/PromptInput";
import StatusBar from "@/components/StatusBar";
import CanvasPane from "@/canvas/CanvasPane";

const CWD_KEY = "pi-gui-cwd";

export default function App() {
  // Wire up Tauri event listeners
  useAgentEvents();
  // Bridge tool events to canvas store
  useCanvasSync();

  const canvasVisible = useUIStore((s) => s.canvasVisible);

  const [agentStarted, setAgentStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cwdInput, setCwdInput] = useState(
    localStorage.getItem(CWD_KEY) || "~/repos/pi-gui"
  );

  const handleStart = useCallback(async (cwd: string) => {
    setStarting(true);
    setError(null);
    try {
      await startAgent(cwd);
      // Give pi a moment to initialize, then fetch state
      await new Promise((r) => setTimeout(r, 1000));
      const state = await getState();
      if (state?.model) {
        useAgentStore.getState().setModel(state.model);
      }
      if (state) {
        useAgentStore.getState().setThinkingLevel(state.thinkingLevel);
        useAgentStore.getState().setSessionInfo({
          sessionId: state.sessionId,
          sessionName: state.sessionName,
        });
        useAgentStore.getState().setStreaming(state.isStreaming);
      }
      setAgentStarted(true);
      localStorage.setItem(CWD_KEY, cwd);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  }, []);

  // Show startup screen if agent not started
  if (!agentStarted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0d1117] text-[#e6edf3]">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-3xl font-bold">π</h1>
          <p className="mb-8 text-[#8b949e]">
            AI Coding Assistant
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-[#f85149] bg-[#3a1a1a] px-4 py-2 text-sm text-[#f85149]">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-xs text-[#8b949e]">Working Directory</label>
            <input
              type="text"
              value={cwdInput}
              onChange={(e) => setCwdInput(e.target.value)}
              className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 font-mono text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff]"
              placeholder="~/repos/my-project"
            />
          </div>

          <button
            type="button"
            disabled={starting || !cwdInput.trim()}
            onClick={() => handleStart(cwdInput.trim())}
            className="rounded-lg bg-[#58a6ff] px-6 py-3 text-sm font-medium text-white hover:bg-[#79b8ff] disabled:opacity-50 transition-colors"
          >
            {starting ? "Starting pi agent..." : "Start Agent"}
          </button>

          <p className="mt-4 text-xs text-[#484f58]">
            Make sure <code className="text-[#58a6ff]">pi</code> is installed on your PATH
          </p>
        </div>
      </div>
    );
  }

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
