import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Check,
  FileCode,
  Loader2,
  MessageSquare,
  Terminal,
  X,
} from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/canvas/canvasStore";
import {
  canOpenInCanvas,
  collectActivityItems,
  extractFilePath,
  extractToolDetail,
  filterActivityItems,
  getToolLabel,
  summarizeActivity,
  type ActivityFilter,
} from "@/lib/activity-utils";
import { getToolVisual } from "@/lib/tool-utils";

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "edits", label: "Edits" },
  { id: "errors", label: "Errors" },
];

function StatusIcon({ status }: { status: "running" | "completed" | "error" }) {
  if (status === "running") {
    return <Loader2 size={12} className="animate-spin" style={{ color: "var(--warning)" }} />;
  }
  if (status === "error") {
    return <X size={12} style={{ color: "var(--error)" }} />;
  }
  return <Check size={12} style={{ color: "var(--success)" }} />;
}

function ToolIcon({ toolName }: { toolName: string }) {
  const visual = getToolVisual(toolName);
  if (toolName === "bash") return <Terminal size={12} strokeWidth={1.75} />;
  if (["edit", "write", "read"].includes(toolName)) {
    return <FileCode size={12} strokeWidth={1.75} />;
  }
  return <>{visual.icon}</>;
}

export default function ActivityView() {
  const messages = useAgentStore((s) => s.messages);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const isCompacting = useAgentStore((s) => s.isCompacting);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);
  const setSidebarView = useUIStore((s) => s.setSidebarView);
  const setActiveFile = useCanvasStore((s) => s.setActiveFile);
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const allItems = useMemo(() => collectActivityItems(messages), [messages]);
  const items = useMemo(
    () => filterActivityItems(allItems, filter),
    [allItems, filter],
  );
  const summary = useMemo(() => summarizeActivity(allItems), [allItems]);
  const runningCount = useMemo(
    () => allItems.filter((item) => item.toolCall.status === "running").length,
    [allItems],
  );

  const handleOpen = useCallback((toolCall: (typeof items)[number]["toolCall"]) => {
    if (!canOpenInCanvas(toolCall)) return;
    const path = extractFilePath(toolCall.toolName, toolCall.args);
    if (!path) return;
    setCanvasVisible(true);
    setActiveFile(path);
  }, [setActiveFile, setCanvasVisible]);

  const handleJumpToChat = useCallback(() => {
    setSidebarView("chats");
  }, [setSidebarView]);

  return (
    <div className="sidebar-activity">
      {(isStreaming || isCompacting) && (
        <div className="sidebar-activity-live">
          {isStreaming && (
            <span className="sidebar-activity-live-pill">
              <span className="sidebar-activity-live-dot" />
              Agent running
              {runningCount > 0 && ` · ${runningCount} tool${runningCount === 1 ? "" : "s"}`}
            </span>
          )}
          {isCompacting && (
            <span className="sidebar-activity-live-pill">
              <Loader2 size={11} className="animate-spin" />
              Compacting
            </span>
          )}
        </div>
      )}

      {allItems.length > 0 && (
        <div className="sidebar-activity-summary">
          {summary.total} tools · {summary.edits} edits · {summary.errors} errors
        </div>
      )}

      <div className="sidebar-activity-filters" role="tablist" aria-label="Activity filters">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={filter === entry.id}
            onClick={() => setFilter(entry.id)}
            className={`sidebar-activity-filter ${filter === entry.id ? "is-active" : ""}`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="sidebar-empty">
          <div className="sidebar-empty-icon">
            <Activity size={18} strokeWidth={1.5} />
          </div>
          <p className="sidebar-empty-title">
            {filter === "all" ? "No activity yet" : `No ${filter}`}
          </p>
          <p className="sidebar-empty-desc">
            {filter === "all"
              ? "Tool calls from the current chat appear here as the agent works."
              : "Try another filter or wait for matching tool calls."}
          </p>
        </div>
      ) : (
        <div className="sidebar-activity-list">
          {items.map((item) => {
            const { toolCall } = item;
            const detail = extractToolDetail(toolCall);
            const openable = canOpenInCanvas(toolCall);
            const visual = getToolVisual(toolCall.toolName);

            return (
              <div
                key={item.id}
                className={`sidebar-activity-card sidebar-activity-card--${toolCall.status}`}
              >
                <div className="sidebar-activity-card-top">
                  <span className={`sidebar-activity-card-badge sidebar-activity-card-badge--${visual.tone}`}>
                    <ToolIcon toolName={toolCall.toolName} />
                    {getToolLabel(toolCall.toolName)}
                  </span>
                  <StatusIcon status={toolCall.status} />
                </div>

                {detail && (
                  <p className="sidebar-activity-card-detail" title={detail}>
                    {detail}
                  </p>
                )}

                <div className="sidebar-activity-card-actions">
                  <button
                    type="button"
                    onClick={handleJumpToChat}
                    className="sidebar-activity-card-btn"
                  >
                    <MessageSquare size={11} />
                    Chat
                  </button>
                  {openable && (
                    <button
                      type="button"
                      onClick={() => handleOpen(toolCall)}
                      className="sidebar-activity-card-btn"
                    >
                      <FileCode size={11} />
                      Canvas
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
