import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink, FileCode } from "lucide-react";
import type { ToolCallInfo } from "@/stores/agentStore";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/canvas/canvasStore";
import {
  extractToolFilePath,
  extractToolOutput,
  getToolSummaryLine,
  getToolVisual,
} from "@/lib/tool-utils";

interface ToolCallPanelProps {
  toolCall: ToolCallInfo;
  isLast?: boolean;
}

export default function ToolCallPanel({ toolCall, isLast = false }: ToolCallPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showFullOutput, setShowFullOutput] = useState(false);
  const [showArgs, setShowArgs] = useState(false);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);
  const setActiveFile = useCanvasStore((s) => s.setActiveFile);

  const visual = getToolVisual(toolCall.toolName);
  const args = toolCall.args as Record<string, unknown> | undefined;
  const filePath = extractToolFilePath(toolCall.toolName, args);
  const canView = ["edit", "write"].includes(toolCall.toolName) && !!filePath;
  const summary = getToolSummaryLine(toolCall);
  const outputText = extractToolOutput(toolCall);
  const isLong = outputText.length > 500;
  const display = !showFullOutput && isLong ? `${outputText.slice(0, 500)}…` : outputText;
  const bashCommand = typeof args?.command === "string" ? args.command : null;
  const hasDetails = !!outputText || !!args || canView || bashCommand !== null;

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
                {bashCommand && (
                  <div className="chat-tool-code-block">
                    <span className="chat-tool-code-prompt">$</span>
                    <span>{bashCommand}</span>
                  </div>
                )}

                {outputText && (
                  <div className="chat-tool-output">
                    <div className="chat-tool-output-label">Output</div>
                    <pre className="chat-tool-output-pre">{display}</pre>
                    {isLong && (
                      <button
                        type="button"
                        className="chat-tool-text-btn"
                        onClick={() => setShowFullOutput((value) => !value)}
                      >
                        {showFullOutput ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}

                {args && Object.keys(args).length > 0 && (
                  <div className="chat-tool-args">
                    <button
                      type="button"
                      className="chat-tool-text-btn"
                      onClick={() => setShowArgs((value) => !value)}
                    >
                      {showArgs ? "Hide arguments" : "Show arguments"}
                    </button>
                    <AnimatePresence initial={false}>
                      {showArgs && (
                        <motion.pre
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.14 }}
                          className="chat-tool-args-pre"
                        >
                          {JSON.stringify(args, null, 2)}
                        </motion.pre>
                      )}
                    </AnimatePresence>
                  </div>
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
