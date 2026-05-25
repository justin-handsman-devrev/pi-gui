import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink, FileCode } from "lucide-react";
import type { ToolCallInfo } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/canvas/canvasStore";
import {
  extractToolFilePath,
  getToolSummaryLine,
  getToolVisual,
} from "@/lib/tool-utils";
import { formatToolArgs, parseToolOutput } from "@/lib/tool-output";
import ToolCallOutput from "./ToolCallOutput";

interface ToolCallPanelProps {
  toolCall: ToolCallInfo;
  isLast?: boolean;
}

export default function ToolCallPanel({ toolCall, isLast = false }: ToolCallPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);
  const setActiveFile = useCanvasStore((s) => s.setActiveFile);

  const visual = getToolVisual(toolCall.toolName);
  const args = toolCall.args as Record<string, unknown> | undefined;
  const filePath = extractToolFilePath(toolCall.toolName, args);
  const canView = ["edit", "write"].includes(toolCall.toolName) && !!filePath;
  const summary = getToolSummaryLine(toolCall);
  const rawResult = toolCall.partialResult ?? toolCall.result;
  const parsed = parseToolOutput(toolCall.toolName, rawResult);
  const argChips = formatToolArgs(args);
  const bashCommand = typeof args?.command === "string" ? args.command : null;
  const hasOutput = parsed.kind !== "empty" || rawResult != null;
  const hasDetails = hasOutput || argChips.length > 0 || canView || bashCommand !== null;

  return (
    <li
      className={`chat-tool-item chat-tool-item--${toolCall.status}${isLast ? " chat-tool-item--last" : ""}`}
    >
      <div className="chat-tool-item-marker" aria-hidden="true">
        <span className="chat-tool-item-dot" />
        {!isLast && <span className="chat-tool-item-line" />}
      </div>

      <div className="chat-tool-item-main">
        <button
          type="button"
          className="chat-tool-item-trigger"
          onClick={() => hasDetails && setExpanded((value) => !value)}
          aria-expanded={hasDetails ? expanded : undefined}
          disabled={!hasDetails}
        >
          <span className={`chat-tool-item-badge chat-tool-item-badge--${visual.tone}`}>
            {visual.icon}
            {visual.label}
          </span>

          <span className="chat-tool-item-summary" title={summary}>
            {summary}
          </span>

          <span className={`chat-tool-item-status chat-tool-item-status--${toolCall.status}`}>
            {toolCall.status === "running" && "Running"}
            {toolCall.status === "completed" && "Done"}
            {toolCall.status === "error" && "Failed"}
          </span>

          {hasDetails && (
            <motion.span
              className="chat-tool-item-chevron"
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.15 }}
              aria-hidden="true"
            >
              <ChevronDown size={13} />
            </motion.span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && hasDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="chat-tool-item-body-wrap"
            >
              <div className="chat-tool-item-body">
                {argChips.length > 0 && (
                  <div className="chat-tool-arg-row">
                    {argChips.map(({ key, value }) => (
                      <span key={key} className="chat-tool-arg-chip">
                        <span className="chat-tool-arg-key">{key}</span>
                        <span className="chat-tool-arg-value">{value}</span>
                      </span>
                    ))}
                  </div>
                )}

                {bashCommand && (
                  <div className="chat-tool-code-block">
                    <span className="chat-tool-code-prompt">$</span>
                    <span>{bashCommand}</span>
                  </div>
                )}

                {hasOutput && (
                  <ToolCallOutput
                    parsed={parsed}
                    toolName={toolCall.toolName}
                    rawValue={rawResult}
                  />
                )}

                {canView && (
                  <button
                    type="button"
                    className="chat-tool-open-btn"
                    onClick={() => {
                      setCanvasVisible(true);
                      setActiveFile(filePath!);
                    }}
                  >
                    <FileCode size={12} />
                    Open in canvas
                    <ExternalLink size={11} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}
