import { useAgentStore } from "@/stores/agentStore";
import { newSession, compactSession } from "@/lib/tauri-commands";

/**
 * Minimal session sidebar — top bar with session name and controls.
 *
 * MVP: renders as an inline top bar. Can evolve into a slide-out panel.
 */
export default function SessionSidebar() {
  const sessionId = useAgentStore((s) => s.sessionId);
  const sessionName = useAgentStore((s) => s.sessionName);
  const isCompacting = useAgentStore((s) => s.isCompacting);

  const handleNewSession = async () => {
    try {
      const result = await newSession();
      if (!result.cancelled) {
        useAgentStore.getState().reset();
      }
    } catch (err) {
      console.error("[SessionSidebar] new session failed:", err);
    }
  };

  const handleCompact = async () => {
    try {
      const result = await compactSession();
      if (!result.success && result.message) {
        console.warn("[SessionSidebar] compact failed:", result.message);
      }
    } catch (err) {
      console.error("[SessionSidebar] compact failed:", err);
    }
  };

  const displayName = sessionName || sessionId?.slice(0, 8) || "New Session";

  return (
    <div
      className="flex h-9 items-center gap-2 px-3"
      style={{
        borderBottom: "1px solid var(--hairline)",
        background: "var(--surface-card)",
      }}
    >
      {/* Session name */}
      <span className="truncate" style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>
        {displayName}
      </span>

      {sessionId && (
        <span style={{ fontSize: 10, color: "var(--muted-soft)" }}>
          {sessionId.slice(0, 8)}
        </span>
      )}

      <div className="flex-1" />

      {/* Compact */}
      <button
        onClick={handleCompact}
        disabled={isCompacting}
        className="hover-surface shrink-0 px-1.5 py-0.5"
        style={{
          borderRadius: "var(--r-sm)",
          fontSize: 10,
          color: "var(--muted-soft)",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
        title="Compact session context"
      >
        {isCompacting ? "Compacting…" : "Compact"}
      </button>

      {/* New session */}
      <button
        onClick={handleNewSession}
        className="hover-surface flex shrink-0 items-center gap-1 px-1.5 py-0.5"
        style={{
          borderRadius: "var(--r-sm)",
          fontSize: 10,
          color: "var(--muted-soft)",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
        title="Start new session"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New
      </button>
    </div>
  );
}
