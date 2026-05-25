import { motion } from "framer-motion";
import { Brain, Hash, Loader2 } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import { fmtSessionCost, fmtTokenCount } from "@/lib/session-stats";
import InlineModelSelector from "./InlineModelSelector";
import ThinkingToggle from "./ThinkingToggle";
import ThinkingLevelDropdown from "./ThinkingLevelDropdown";
import ContextWindowIndicator from "./ContextWindowIndicator";
import CompactButton from "./CompactButton";
import ExportButton from "./ExportButton";
import ThemeToggle from "./ThemeToggle";
import AppZoomControl from "./AppZoomControl";

function formatContextTokens(tokens: number | null | undefined): string {
  if (tokens == null) return "—";
  return fmtTokenCount(tokens);
}

export default function AppFooter() {
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const isCompacting = useAgentStore((s) => s.isCompacting);
  const sessionStats = useAgentStore((s) => s.sessionStats);
  const sessionId = useAgentStore((s) => s.sessionId);
  const thinkingLevel = useAgentStore((s) => s.thinkingLevel);

  const thinkingEnabled = thinkingLevel.toLowerCase() !== "off";
  const projectCwd = getActiveProjectCwd();
  const projectName = projectCwd.split("/").filter(Boolean).pop() ?? "No workspace";

  const contextTokens = sessionStats?.contextUsage?.tokens;
  const inputTokens = sessionStats?.tokens.input ?? 0;
  const outputTokens = sessionStats?.tokens.output ?? 0;
  const sessionCost = sessionStats?.cost ?? 0;

  return (
    <footer className="app-footer" aria-label="Agent controls and status">
      <div className="app-footer-section app-footer-agent">
        <InlineModelSelector variant="footer" />

        <div className="app-footer-divider" aria-hidden="true" />

        <div className="app-footer-thinking">
          <Brain size={12} className="shrink-0" style={{ color: "var(--muted-soft)" }} />
          <span className="app-footer-label">Thinking</span>
          <ThinkingToggle />
          <ThinkingLevelDropdown disabled={!thinkingEnabled} />
        </div>
      </div>

      <div className="app-footer-section app-footer-status">
        <span className="app-footer-workspace" title={projectCwd || undefined}>
          <span className="app-footer-label">Workspace</span>
          <span className="app-footer-workspace-name">{projectName}</span>
        </span>

        {isStreaming && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-footer-pill is-active"
          >
            <span className="app-footer-stream-dot" />
            Streaming
          </motion.span>
        )}
        {isCompacting && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-footer-pill"
          >
            <Loader2 size={11} className="animate-spin" />
            Compacting
          </motion.span>
        )}

        {sessionStats && (
          <div
            className="app-footer-stats"
            title="Context tokens · session input · session output · session cost"
          >
            <span className="app-footer-stat">
              <span className="app-footer-label">Ctx</span>
              <span className="app-footer-stat-value">{formatContextTokens(contextTokens)}</span>
            </span>
            <span className="app-footer-stat-sep" aria-hidden="true">·</span>
            <span className="app-footer-stat">
              <span className="app-footer-label">In</span>
              <span className="app-footer-stat-value">{fmtTokenCount(inputTokens)}</span>
            </span>
            <span className="app-footer-stat-sep" aria-hidden="true">·</span>
            <span className="app-footer-stat">
              <span className="app-footer-label">Out</span>
              <span className="app-footer-stat-value">{fmtTokenCount(outputTokens)}</span>
            </span>
            <span className="app-footer-stat-sep" aria-hidden="true">·</span>
            <span className="app-footer-stat">
              <span className="app-footer-label">Cost</span>
              <span className="app-footer-stat-value">{fmtSessionCost(sessionCost)}</span>
            </span>
          </div>
        )}

        <div className="hidden md:flex">
          <ContextWindowIndicator />
        </div>
      </div>

      <div className="app-footer-section app-footer-actions">
        <CompactButton />
        <ExportButton />
        <AppZoomControl />
        <ThemeToggle />

        {sessionId && (
          <span className="app-footer-meta">
            <Hash size={10} />
            {sessionId.slice(0, 8)}
          </span>
        )}
      </div>
    </footer>
  );
}
