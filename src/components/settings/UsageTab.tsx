import { useEffect, useMemo, useState } from "react";
import { Gauge, RefreshCw } from "lucide-react";
import { ExtensionStat } from "@/components/extensions/extension-ui";
import { useAgentStore } from "@/stores/agentStore";
import {
  fmtSessionCost,
  fmtTokenCount,
  refreshSessionStats,
} from "@/lib/session-stats";
import { computeUsageAggregate, useUsageStore } from "@/stores/usageStore";
import { SettingSection } from "./settings-ui";

function formatContextTokens(tokens: number | null | undefined): string {
  if (tokens == null) return "—";
  return fmtTokenCount(tokens);
}

function UsageContextBar({
  tokens,
  contextWindow,
  percent,
}: {
  tokens: number | null;
  contextWindow: number;
  percent: number | null;
}) {
  if (tokens == null || contextWindow <= 0) {
    return (
      <p className="usage-context-empty">
        Context usage unavailable — usually clears briefly after compaction.
      </p>
    );
  }

  const usagePct = percent ?? Math.min(100, (tokens / contextWindow) * 100);
  const barColor =
    usagePct > 90
      ? "var(--error)"
      : usagePct > 70
        ? "var(--warning)"
        : "var(--grad-lavender)";

  return (
    <div className="usage-context-bar">
      <div className="usage-context-track">
        <div
          className="usage-context-fill"
          style={{ width: `${usagePct}%`, background: barColor }}
        />
      </div>
      <div className="usage-context-meta">
        <span>{fmtTokenCount(tokens)} used</span>
        <span>{Math.round(usagePct)}%</span>
        <span>{fmtTokenCount(contextWindow)} window</span>
      </div>
    </div>
  );
}

export default function UsageTab() {
  const sessionStats = useAgentStore((s) => s.sessionStats);
  const sessionId = useAgentStore((s) => s.sessionId);
  const sessionName = useAgentStore((s) => s.sessionName);
  const model = useAgentStore((s) => s.model);
  const bySession = useUsageStore((s) => s.bySession);
  const clearHistory = useUsageStore((s) => s.clearHistory);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refreshSessionStats();
  }, []);

  const aggregate = useMemo(() => computeUsageAggregate(bySession), [bySession]);

  const recentSessions = useMemo(
    () => Object.values(bySession).sort((a, b) => b.updatedAt - a.updatedAt),
    [bySession],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSessionStats();
    } finally {
      setRefreshing(false);
    }
  };

  const contextTokens = sessionStats?.contextUsage?.tokens ?? null;
  const contextWindow = sessionStats?.contextUsage?.contextWindow ?? 0;
  const contextPercent = sessionStats?.contextUsage?.percent ?? null;

  return (
    <div className="settings-page">
      <div className="settings-hero-card">
        <div className="settings-hero-icon">
          <Gauge size={18} strokeWidth={1.75} />
        </div>
        <div className="settings-hero-copy">
          <p className="settings-hero-label">Current session</p>
          <p className="settings-hero-value">{sessionName || "Untitled chat"}</p>
          {model && (
            <p className="usage-hero-model">
              {model.provider}/{model.id}
            </p>
          )}
        </div>
        <button
          type="button"
          className="ext-icon-btn usage-refresh-btn"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          title="Refresh usage"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {sessionStats ? (
        <>
          <div className="usage-stats-grid">
            <ExtensionStat label="Context" value={formatContextTokens(contextTokens)} />
            <ExtensionStat label="Input" value={fmtTokenCount(sessionStats.tokens.input)} />
            <ExtensionStat label="Output" value={fmtTokenCount(sessionStats.tokens.output)} />
            <ExtensionStat label="Cost" value={fmtSessionCost(sessionStats.cost)} tone="success" />
          </div>

          <SettingSection title="Context window" description="Live estimate for the active chat.">
            <UsageContextBar
              tokens={contextTokens}
              contextWindow={contextWindow}
              percent={contextPercent}
            />
          </SettingSection>

          {(sessionStats.tokens.cacheRead != null || sessionStats.tokens.cacheWrite != null) && (
            <div className="ext-stats-row settings-stats-row">
              {sessionStats.tokens.cacheRead != null && (
                <ExtensionStat label="Cache read" value={fmtTokenCount(sessionStats.tokens.cacheRead)} />
              )}
              {sessionStats.tokens.cacheWrite != null && (
                <ExtensionStat label="Cache write" value={fmtTokenCount(sessionStats.tokens.cacheWrite)} />
              )}
            </div>
          )}
        </>
      ) : (
        <div className="settings-empty">
          No usage data yet. Start a chat or refresh once the agent is running.
        </div>
      )}

      <SettingSection
        title="All tracked sessions"
        description="Cumulative totals across chats recorded in this app."
      >
        <div className="usage-stats-grid">
          <ExtensionStat label="Sessions" value={aggregate.sessions} />
          <ExtensionStat label="Input" value={fmtTokenCount(aggregate.input)} />
          <ExtensionStat label="Output" value={fmtTokenCount(aggregate.output)} />
          <ExtensionStat label="Cost" value={fmtSessionCost(aggregate.cost)} tone="success" />
        </div>
      </SettingSection>

      <SettingSection title="Session history" description="Latest snapshot per chat.">
        {recentSessions.length === 0 ? (
          <p className="usage-history-empty">Usage history will appear as you chat.</p>
        ) : (
          <div className="usage-history-list">
            {recentSessions.map((session) => {
              const active = session.sessionId === sessionId;
              return (
                <div
                  key={session.sessionId}
                  className={`usage-history-row${active ? " is-active" : ""}`}
                >
                  <div className="usage-history-main">
                    <span className="usage-history-name">{session.sessionName}</span>
                    {session.modelLabel && (
                      <span className="usage-history-model">{session.modelLabel}</span>
                    )}
                  </div>
                  <div className="usage-history-stats">
                    <span>{formatContextTokens(session.contextTokens)} ctx</span>
                    <span>{fmtTokenCount(session.input)} in</span>
                    <span>{fmtTokenCount(session.output)} out</span>
                    <span>{fmtSessionCost(session.cost)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {recentSessions.length > 0 && (
          <div className="usage-history-actions">
            <button type="button" className="btn-outline usage-clear-btn" onClick={clearHistory}>
              Clear usage history
            </button>
          </div>
        )}
      </SettingSection>
    </div>
  );
}
