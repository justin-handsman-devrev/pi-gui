import { useAgentStore } from "@/stores/agentStore";
import { fmtTokenCount } from "@/lib/session-stats";

export default function ContextWindowIndicator() {
  const sessionStats = useAgentStore((s) => s.sessionStats);

  if (!sessionStats?.contextUsage) return null;

  const { tokens, contextWindow, percent } = sessionStats.contextUsage;
  if (tokens == null || contextWindow <= 0) return null;

  const usagePct = percent ?? Math.min(100, (tokens / contextWindow) * 100);

  const barColor =
    usagePct > 90
      ? "var(--error)"
      : usagePct > 70
        ? "var(--warning)"
        : "var(--grad-lavender)";

  return (
    <div className="flex items-center gap-2" style={{ fontSize: 11 }}>
      <div
        className="flex-1"
        style={{
          height: 4,
          background: "var(--surface-strong)",
          borderRadius: "var(--r-pill)",
          overflow: "hidden",
          minWidth: 40,
        }}
      >
        <div
          style={{
            width: `${usagePct}%`,
            height: "100%",
            background: barColor,
            borderRadius: "var(--r-pill)",
            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease",
          }}
        />
      </div>
      <span style={{ color: "var(--muted-soft)", fontSize: 10, whiteSpace: "nowrap", letterSpacing: "0.2px" }}>
        {Math.round(usagePct)}%
      </span>
      <span
        className="hidden lg:inline"
        style={{ color: "var(--muted-soft)", fontSize: 10, whiteSpace: "nowrap", letterSpacing: "0.2px" }}
        title={`${fmtTokenCount(tokens)} of ${fmtTokenCount(contextWindow)} context window`}
      >
        / {fmtTokenCount(contextWindow)}
      </span>
    </div>
  );
}
