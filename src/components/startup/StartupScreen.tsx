import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, FolderOpen, FolderSearch, Sparkles, Terminal } from "lucide-react";
import { startAgent, getState } from "@/lib/tauri-commands";
import { syncAgentQueuesFromState } from "@/lib/sync-agent-queues";
import { refreshSessionStats } from "@/lib/session-stats";
import { invalidateSlashCommandCache } from "@/lib/slash-commands";
import { useAgentStore } from "@/stores/agentStore";
import { CWD_KEY, setActiveProjectCwd } from "@/lib/project-cwd";
import { initFileTree } from "@/lib/init-file-tree";
import { getDefaultProjectCwd, pickProjectDirectory } from "@/lib/pick-project-dir";

interface StartupScreenProps {
  onStarted: () => void;
}

const EXAMPLE_PATHS = ["~/repos/my-app", "~/projects/pi-gui", "."];

export default function StartupScreen({ onStarted }: StartupScreenProps) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cwdInput, setCwdInput] = useState(getDefaultProjectCwd());
  const [browsing, setBrowsing] = useState(false);

  const handleStart = useCallback(
    async (cwd: string) => {
      const target = cwd.trim();
      if (!target || starting) return;

      setStarting(true);
      setError(null);

      try {
        await startAgent(target);
        invalidateSlashCommandCache();
        await new Promise((r) => setTimeout(r, 1000));
        const state = await getState();
        if (state?.model) useAgentStore.getState().setModel(state.model);
        if (state) {
          useAgentStore.getState().setThinkingLevel(state.thinkingLevel);
          useAgentStore.getState().setSessionInfo({
            sessionId: state.sessionId,
            sessionName: state.sessionName,
            sessionFile: state.sessionFile,
          });
          useAgentStore.getState().setStreaming(state.isStreaming);
          syncAgentQueuesFromState(state as unknown as Record<string, unknown>);
        }
        void refreshSessionStats();
        setActiveProjectCwd(target);
        void initFileTree(target);
        onStarted();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setStarting(false);
      }
    },
    [onStarted, starting],
  );

  const handleBrowse = useCallback(async () => {
    if (browsing || starting) return;
    setBrowsing(true);
    setError(null);
    try {
      const selected = await pickProjectDirectory();
      if (selected) {
        setCwdInput(selected);
        localStorage.setItem(CWD_KEY, selected);
      }
    } finally {
      setBrowsing(false);
    }
  }, [browsing, starting]);

  return (
    <div className="startup-screen">
      <div className="startup-hero">
        <div className="startup-orbs" aria-hidden="true">
          <div className="orb orb-lavender orb-drift startup-orb startup-orb-a" />
          <div className="orb orb-mint startup-orb startup-orb-b" />
          <div className="orb orb-peach startup-orb startup-orb-c" />
          <div className="orb orb-sky startup-orb startup-orb-d" />
        </div>

        <div className="startup-hero-inner">
          <div className="startup-brand">
            <div className="startup-brand-mark">π</div>
            <span className="startup-brand-name">Pi</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            className="startup-hero-copy"
          >
            <p className="startup-eyebrow">Local AI coding agent</p>
            <h1 className="startup-headline">
              Code with clarity.
              <br />
              Run locally.
              <br />
              Stay in flow.
            </h1>
            <p className="startup-lede">
              An editorial workspace for Pi — your repo, your machine, your agent. No cloud required.
            </p>
          </motion.div>

          <p className="startup-footnote">Eärendil Works</p>
        </div>
      </div>

      <div className="startup-panel">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.4, 0, 0.2, 1] }}
          className="startup-card"
        >
          <div className="startup-card-header">
            <div className="startup-card-icon">
              <Sparkles size={16} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="startup-card-title">Open a project</h2>
              <p className="startup-card-desc">
                Point Pi at the directory you want to work in.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="startup-error-wrap"
              >
                <div className="startup-error">{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <label className="startup-label" htmlFor="cwd-input">
            Working directory
          </label>
          <div className="startup-input-row">
            <div className="startup-input-wrap">
              <FolderOpen size={15} className="startup-input-icon" />
              <input
                id="cwd-input"
                type="text"
                className="startup-input"
                value={cwdInput}
                onChange={(e) => setCwdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && cwdInput.trim() && !starting) {
                    handleStart(cwdInput.trim());
                  }
                }}
                placeholder="~/repos/my-project"
                autoFocus
              />
            </div>
            <button
              type="button"
              className="startup-browse-btn"
              onClick={handleBrowse}
              disabled={starting || browsing}
              title="Browse for folder"
            >
              <FolderSearch size={15} strokeWidth={1.75} />
              {browsing ? "Opening…" : "Browse"}
            </button>
          </div>

          <div className="startup-quick-paths">
            {EXAMPLE_PATHS.map((path) => (
              <button
                key={path}
                type="button"
                className="startup-quick-path"
                onClick={() => setCwdInput(path)}
              >
                {path}
              </button>
            ))}
          </div>

          <motion.button
            type="button"
            disabled={starting || !cwdInput.trim()}
            onClick={() => handleStart(cwdInput.trim())}
            whileTap={{ scale: 0.98 }}
            className="startup-submit"
          >
            {starting ? (
              <>
                <span className="startup-spinner" />
                Starting session…
              </>
            ) : (
              <>
                <Terminal size={16} strokeWidth={1.75} />
                Start session
                <ArrowRight size={15} />
              </>
            )}
          </motion.button>

          <p className="startup-requirements">
            Requires <code>pi</code> on your PATH
          </p>
        </motion.div>
      </div>
    </div>
  );
}
