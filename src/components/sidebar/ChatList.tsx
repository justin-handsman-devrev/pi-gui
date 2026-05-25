import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { useFilteredSessions } from "@/stores/sessionHistoryStore";
import { switchToSession } from "@/lib/switch-session";

interface ChatListProps {
  onNewChat: () => void;
}

export default function ChatList({ onNewChat }: ChatListProps) {
  const sessions = useFilteredSessions();
  const sessionId = useAgentStore((s) => s.sessionId);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = useCallback(async (session: (typeof sessions)[number]) => {
    if (session.id === sessionId || loadingId) return;
    setLoadingId(session.id);
    try {
      await switchToSession(session);
    } finally {
      setLoadingId(null);
    }
  }, [sessionId, loadingId]);

  if (sessions.length === 0) {
    return (
      <div className="sidebar-empty">
        <div className="sidebar-empty-icon">
          <MessageSquare size={18} strokeWidth={1.5} />
        </div>
        <p className="sidebar-empty-title">No chats yet</p>
        <p className="sidebar-empty-desc">
          Send a message to start your first conversation.
        </p>
        <button
          type="button"
          onClick={onNewChat}
          disabled={isStreaming}
          className="sidebar-btn-outline"
          style={{ marginTop: 4 }}
        >
          <Plus size={12} />
          New chat
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-list">
      {sessions.map((session) => {
        const isActive = session.id === sessionId;
        const isLoading = loadingId === session.id;
        const preview = session.messages.find((m) => m.role === "user")?.content
          ?? session.messages[0]?.content
          ?? "Empty chat";

        return (
          <button
            key={session.id}
            type="button"
            onClick={() => handleSelect(session)}
            disabled={isLoading || (isStreaming && !isActive)}
            className={`sidebar-chat-row ${isActive ? "is-active" : ""}`}
            title={session.name}
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            <div className="sidebar-chat-title">
              <MessageSquare
                size={12}
                strokeWidth={1.75}
                className="shrink-0"
                style={{ color: isActive ? "var(--body-strong)" : "var(--muted-soft)" }}
              />
              <span className="sidebar-chat-name">{session.name}</span>
              <span className="sidebar-chat-meta">
                {isLoading ? "…" : formatDistanceToNow(session.updatedAt, { addSuffix: false })}
              </span>
            </div>
            <p className="sidebar-chat-preview">{preview}</p>
          </button>
        );
      })}
    </div>
  );
}
