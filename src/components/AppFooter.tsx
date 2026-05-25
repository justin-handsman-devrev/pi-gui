import { motion } from "framer-motion";
import { Brain, Loader2 } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import InlineModelSelector from "./InlineModelSelector";
import ThinkingToggle from "./ThinkingToggle";
import ThinkingLevelDropdown from "./ThinkingLevelDropdown";
import CompactButton from "./CompactButton";
import SessionStatusPanel from "./SessionStatusPanel";
import FooterMoreMenu from "./FooterMoreMenu";
import AppZoomControl from "./AppZoomControl";
import ThemeToggle from "./ThemeToggle";

export default function AppFooter() {
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const isCompacting = useAgentStore((s) => s.isCompacting);
  const thinkingLevel = useAgentStore((s) => s.thinkingLevel);

  const thinkingEnabled = thinkingLevel.toLowerCase() !== "off";
  const projectCwd = getActiveProjectCwd();
  const projectName = projectCwd.split("/").filter(Boolean).pop() ?? "No workspace";

  return (
    <footer className="app-footer" aria-label="Agent controls and status">
      <div className="app-footer-section app-footer-primary">
        <InlineModelSelector variant="footer" />

        <div className="app-footer-divider" aria-hidden="true" />

        <div className="app-footer-thinking" title="Extended thinking">
          <Brain size={12} className="shrink-0" style={{ color: "var(--muted-soft)" }} />
          <ThinkingToggle />
          <ThinkingLevelDropdown disabled={!thinkingEnabled} />
        </div>
      </div>

      <div className="app-footer-section app-footer-center">
        <span className="app-footer-workspace" title={projectCwd || undefined}>
          <span className="app-footer-label">Workspace</span>
          <span className="app-footer-workspace-name">{projectName}</span>
        </span>
      </div>

      <div className="app-footer-section app-footer-secondary">
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

        <SessionStatusPanel />
        <CompactButton variant="icon" />
        <AppZoomControl />
        <ThemeToggle variant="icon" />
        <FooterMoreMenu />
      </div>
    </footer>
  );
}
