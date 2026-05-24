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

// Color tokens - warm darks (ElevenLabs inspired)
const colors = {
  canvasPrimary: '#0c0a09',
  canvasSurface: '#131210',
  canvasElevated: '#1c1917',
  ink700: '#44403c',
  ink500: '#78716c',
  ink400: '#a8a29e',
  actionPrimary: '#292524',
  actionHover: '#44403c',
  textPrimary: '#fafaf9',
  textSecondary: '#a8a29e',
  auroraLavender: '#9d8bb8',
  auroraRose: '#c98b8b',
};

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
      <div 
        className="flex h-screen flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: colors.canvasPrimary }}
      >
        {/* Aurora orb background */}
        <div 
          className="absolute pointer-events-none"
          style={{
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.auroraLavender}40 0%, transparent 70%)`,
            filter: 'blur(80px)',
            opacity: 0.06,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'drift 20s ease-in-out infinite alternate',
          }}
        />
        
        {/* Additional subtle orb */}
        <div 
          className="absolute pointer-events-none"
          style={{
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.auroraRose}30 0%, transparent 70%)`,
            filter: 'blur(60px)',
            opacity: 0.04,
            top: '45%',
            left: '55%',
            transform: 'translate(-50%, -50%)',
            animation: 'drift 25s ease-in-out infinite alternate-reverse',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-md text-center relative z-10"
        >
          {/* Logo with radial aurora glow */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="relative inline-block"
          >
            {/* Logo glow */}
            <div 
              className="absolute pointer-events-none"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${colors.auroraLavender}60 0%, transparent 70%)`,
                filter: 'blur(24px)',
                opacity: 0.15,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <span 
              className="block font-semibold leading-none"
              style={{ 
                fontSize: '48px', 
                letterSpacing: '-1.44px', 
                lineHeight: '1.05',
                color: colors.textPrimary,
              }}
            >
              π
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-4 font-medium"
            style={{ 
              fontSize: '28px', 
              letterSpacing: '-0.28px', 
              lineHeight: '1.12',
              color: colors.textPrimary,
            }}
          >
            Pi GUI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-1"
            style={{ 
              fontSize: '13px', 
              lineHeight: '1.4',
              color: colors.textSecondary,
            }}
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
                <div 
                  className="rounded-lg px-4 py-2.5 text-sm"
                  style={{ 
                    border: `1px solid ${colors.auroraRose}40`,
                    backgroundColor: `${colors.auroraRose}10`,
                    color: colors.auroraRose,
                  }}
                >
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
            <label 
              className="mb-1.5 block text-left text-xs font-medium"
              style={{ color: colors.ink500 }}
            >
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
                className="flex-1 px-4 py-2.5 font-mono text-sm outline-none transition-all duration-150"
                style={{
                  borderRadius: '9999px',
                  border: `1px solid ${colors.ink700}`,
                  backgroundColor: colors.canvasSurface,
                  color: colors.textPrimary,
                }}
                placeholder="~/repos/my-project"
              />
              <motion.button
                type="button"
                disabled={starting || !cwdInput.trim()}
                onClick={() => handleStart(cwdInput.trim())}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderRadius: '9999px',
                  backgroundColor: colors.actionPrimary,
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  if (!starting && cwdInput.trim()) {
                    e.currentTarget.style.backgroundColor = colors.actionHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.actionPrimary;
                }}
              >
                <Terminal size={14} />
                {starting ? "Starting…" : "Start"}
              </motion.button>
            </div>

            <p 
              className="mt-3 text-xs"
              style={{ color: colors.ink500 }}
            >
              Make sure <code 
                className="rounded px-1.5 py-0.5 font-mono"
                style={{ 
                  backgroundColor: colors.canvasSurface,
                  color: colors.auroraLavender,
                }}
              >pi</code> is installed on your PATH
            </p>
          </motion.div>
        </motion.div>

        {/* Keyframe animation for aurora drift */}
        <style>{`
          @keyframes drift {
            from {
              transform: translate(-50%, -50%) translateX(-20px) translateY(-10px);
            }
            to {
              transform: translate(-50%, -50%) translateX(20px) translateY(10px);
            }
          }
        `}</style>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────
  return (
    <div 
      className="flex h-screen flex-col overflow-hidden relative"
      style={{ 
        backgroundColor: colors.canvasPrimary,
        color: colors.textPrimary,
      }}
    >
      {/* Subtle aurora orb behind split panes */}
      <div 
        className="absolute pointer-events-none"
        style={{
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.auroraLavender}30 0%, transparent 70%)`,
          filter: 'blur(100px)',
          opacity: 0.04,
          top: '30%',
          right: '-200px',
        }}
      />

      {/* Top area: Sidebar + Main */}
      <div className="flex flex-1 min-h-0 relative z-10">
        {/* Sidebar */}
        <Sidebar />

        {/* Sidebar collapsed toggle - ghost button style */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute left-2 top-2 z-20 p-1.5 transition-all duration-150"
            style={{
              borderRadius: '9999px',
              color: colors.ink500,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.canvasElevated;
              e.currentTarget.style.color = colors.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.ink500;
            }}
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

          {/* Resize handle - subtle hairline with aurora hover */}
          {canvasVisible && (
            <Separator
              className="w-px transition-all duration-150 hover:bg-opacity-100"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
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
