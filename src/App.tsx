import { useState, useCallback } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useAgentEvents } from "@/hooks/useAgentEvents";
import { useCanvasSync } from "@/hooks/useCanvasSync";
import { startAgent, getState } from "@/lib/tauri-commands";
import Sidebar from "@/components/sidebar/Sidebar";
import SettingsPanel from "@/components/settings/SettingsPanel";
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

  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
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

  // ── Startup screen ──────────────────────────────────────────────────────
  if (!agentStarted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <span className="gradient-text text-7xl font-bold leading-none">
              π
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-4 text-2xl font-semibold text-zinc-400"
          >
            Pi GUI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-1 text-sm text-zinc-500"
          >
            AI Coding Assistant
          </motion.p>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CWD input + start button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-8"
          >
            <label className="mb-1.5 block text-left text-xs font-medium text-zinc-500">
              Working Directory
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cwdInput}
                onChange={(e) => setCwdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && cwdInput.trim() && !starting) {
                    handleStart(cwdInput.trim());
                  }
                }}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 font-mono text-sm text-zinc-50 outline-none transition-colors duration-150 placeholder:text-zinc-600 focus:border-violet-500"
                placeholder="~/repos/my-project"
              />
              <button
                type="button"
                disabled={starting || !cwdInput.trim()}
                onClick={() => handleStart(cwdInput.trim())}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Terminal size={14} />
                {starting ? "Starting…" : "Start"}
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-600">
              Make sure <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-violet-400">pi</code> is installed on your PATH
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Top area: Sidebar + Main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Sidebar collapsed toggle */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute left-2 top-2 z-20 rounded-md p-1.5 text-zinc-600 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-400"
            title="Open sidebar"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}

        {/* Main content: Chat + Canvas split */}
        <Group
          orientation="horizontal"
          id="pi-gui-main"
          style={{ height: "100%", width: "100%" }}
        >
          {/* Chat pane */}
          <Panel
            id="chat"
            defaultSize={canvasVisible ? 55 : 100}
            minSize={25}
            className="flex flex-col min-w-0"
          >
            <ChatView />
            <PromptInput />
          </Panel>

          {/* Resize handle */}
          {canvasVisible && (
            <Separator
              className="w-px transition-colors duration-150"
              style={{
                backgroundColor: "var(--border-subtle)",
              }}
            />
          )}

          {/* Canvas pane */}
          {canvasVisible && (
            <Panel
              id="canvas"
              defaultSize={45}
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

      {/* Settings overlay */}
      <SettingsPanel />
    </div>
  );
}
