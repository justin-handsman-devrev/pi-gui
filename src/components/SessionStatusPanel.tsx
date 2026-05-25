import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Copy,
  Check,
  FolderOpen,
  Hash,
} from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import { fmtSessionCost, fmtTokenCount } from "@/lib/session-stats";
import { useUIStore } from "@/stores/uiStore";

function contextBarColor(usagePct: number): string {
  if (usagePct > 90) return "var(--error)";
  if (usagePct > 70) return "var(--warning)";
  return "var(--grad-lavender)";
}

export default function SessionStatusPanel() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const sessionStats = useAgentStore((s) => s.sessionStats);
  const sessionId = useAgentStore((s) => s.sessionId);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  const projectCwd = getActiveProjectCwd();
  const projectName = projectCwd.split("/").filter(Boolean).pop() ?? "No workspace";

  const contextTokens = sessionStats?.contextUsage?.tokens;
  const contextWindow = sessionStats?.contextUsage?.contextWindow ?? 0;
  const usagePct = sessionStats?.contextUsage?.percent
    ?? (contextTokens != null && contextWindow > 0
      ? Math.min(100, (contextTokens / contextWindow) * 100)
      : null);

  const inputTokens = sessionStats?.tokens.input ?? 0;
  const outputTokens = sessionStats?.tokens.output ?? 0;
  const sessionCost = sessionStats?.cost ?? 0;

  const chipLabel = usagePct != null
    ? `${Math.round(usagePct)}% context`
    : sessionStats
      ? fmtSessionCost(sessionCost)
      : projectName;

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const copySessionId = useCallback(async () => {
    if (!sessionId) return;
    await navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sessionId]);

  const openUsageSettings = useCallback(() => {
    setOpen(false);
    setSettingsOpen(true);
  }, [setSettingsOpen]);

  return (
    <div className="session-status" ref={panelRef}>
      <button
        type="button"
        className={`session-status-chip${open ? " is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Session details — workspace, tokens, and cost"
      >
        {usagePct != null && (
          <span className="session-status-chip-meter" aria-hidden="true">
            <span
              className="session-status-chip-meter-fill"
              style={{
                width: `${Math.max(8, usagePct)}%`,
                background: contextBarColor(usagePct),
              }}
            />
          </span>
        )}
        <Activity size={11} className="session-status-chip-icon" />
        <span className="session-status-chip-label">{chipLabel}</span>
        {sessionStats && usagePct != null && sessionCost > 0 && (
          <span className="session-status-chip-meta">{fmtSessionCost(sessionCost)}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="session-status-popover"
            role="dialog"
            aria-label="Session details"
          >
            <header className="session-status-popover-head">
              <h3 className="session-status-popover-title">Session</h3>
              <button
                type="button"
                className="session-status-link"
                onClick={openUsageSettings}
              >
                Usage history
              </button>
            </header>

            <section className="session-status-block">
              <div className="session-status-row">
                <FolderOpen size={13} className="session-status-row-icon" />
                <div className="session-status-row-copy">
                  <p className="session-status-row-title">{projectName}</p>
                  {projectCwd && (
                    <p className="session-status-row-desc" title={projectCwd}>
                      {projectCwd}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {sessionStats && (
              <>
                <section className="session-status-block">
                  <p className="session-status-kicker">Context window</p>
                  {usagePct != null ? (
                    <>
                      <div className="session-status-context-bar">
                        <div
                          className="session-status-context-fill"
                          style={{
                            width: `${usagePct}%`,
                            background: contextBarColor(usagePct),
                          }}
                        />
                      </div>
                      <div className="session-status-context-meta">
                        <span>{Math.round(usagePct)}% used</span>
                        <span>
                          {formatContextTokens(contextTokens)} / {fmtTokenCount(contextWindow)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="session-status-empty">No context data yet</p>
                  )}
                </section>

                <section className="session-status-metrics">
                  <div className="session-status-metric">
                    <span className="session-status-metric-label">Input</span>
                    <span className="session-status-metric-value">{fmtTokenCount(inputTokens)}</span>
                  </div>
                  <div className="session-status-metric">
                    <span className="session-status-metric-label">Output</span>
                    <span className="session-status-metric-value">{fmtTokenCount(outputTokens)}</span>
                  </div>
                  <div className="session-status-metric">
                    <span className="session-status-metric-label">Cost</span>
                    <span className="session-status-metric-value">{fmtSessionCost(sessionCost)}</span>
                  </div>
                </section>
              </>
            )}

            {sessionId && (
              <footer className="session-status-footer">
                <Hash size={10} />
                <span className="session-status-id">{sessionId.slice(0, 12)}…</span>
                <button
                  type="button"
                  className="session-status-copy"
                  onClick={() => void copySessionId()}
                  title="Copy session ID"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </footer>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatContextTokens(tokens: number | null | undefined): string {
  if (tokens == null) return "—";
  return fmtTokenCount(tokens);
}
