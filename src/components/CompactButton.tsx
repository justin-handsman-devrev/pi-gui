import { useCallback } from "react";
import { Minimize2 } from "lucide-react";
import { compactSession } from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";
import { useNotificationStore } from "@/stores/notificationStore";

export default function CompactButton({ variant = "default" }: { variant?: "default" | "icon" }) {
  const isCompacting = useAgentStore((s) => s.isCompacting);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleCompact = useCallback(async () => {
    if (isCompacting || isStreaming) return;
    try {
      const result = await compactSession();
      if (result.success) {
        addNotification({
          type: "success",
          title: "Session compacted",
          message: result.tokensSaved ? `Saved ${result.tokensSaved.toLocaleString()} tokens` : undefined,
        });
      } else {
        addNotification({ type: "warning", title: "Compaction incomplete", message: result.message });
      }
    } catch {
      addNotification({ type: "error", title: "Compaction failed" });
    }
  }, [isCompacting, isStreaming, addNotification]);

  if (variant === "icon") {
    return (
      <button
        onClick={handleCompact}
        disabled={isCompacting || isStreaming}
        className="app-footer-icon-btn"
        title={isCompacting ? "Compacting…" : "Compact session context"}
        aria-label="Compact session context"
      >
        <Minimize2 size={14} />
      </button>
    );
  }

  return (
    <button
      onClick={handleCompact}
      disabled={isCompacting || isStreaming}
      className="btn-ghost"
      style={{
        height: 28,
        fontSize: 12,
        padding: "0 8px",
        gap: 4,
        opacity: isCompacting ? 0.5 : 1,
      }}
      title="Compact session context"
    >
      <Minimize2 size={12} />
      {isCompacting ? "Compacting…" : "Compact"}
    </button>
  );
}
