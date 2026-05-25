import { useState, useCallback } from "react";
import { Check, X, FileCode } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/canvas/canvasStore";

interface DiffActionProps {
  filePath: string;
  edits: Array<{
    oldText: string;
    newText: string;
  }>;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function DiffActions({ filePath, edits, onAccept, onReject }: DiffActionProps) {
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);
  const setActiveFile = useCanvasStore((s) => s.setActiveFile);

  const handleAccept = useCallback((index: number) => {
    setAccepted((prev) => new Set(prev).add(index));
    onAccept?.();
  }, [onAccept]);

  const handleReject = useCallback((index: number) => {
    setRejected((prev) => new Set(prev).add(index));
    onReject?.();
  }, [onReject]);

  const handleOpenInCanvas = useCallback(() => {
    setCanvasVisible(true);
    setActiveFile(filePath);
  }, [filePath, setCanvasVisible, setActiveFile]);

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
          {edits.length} edit{edits.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={handleOpenInCanvas}
          className="btn-ghost"
          style={{ height: 28, fontSize: 11, padding: "0 12px", gap: 8 }}
        >
          <FileCode size={11} />
          Open in Canvas
        </button>
      </div>

      {edits.map((edit, i) => {
        const isAccepted = accepted.has(i);
        const isRejected = rejected.has(i);
        const isResolved = isAccepted || isRejected;

        return (
          <div
            key={i}
            className="overflow-hidden"
            style={{
              borderRadius: "var(--r-md)",
              border: `1px solid ${isAccepted ? "color-mix(in srgb, var(--success) 30%, transparent)" : isRejected ? "color-mix(in srgb, var(--error) 30%, transparent)" : "var(--hairline)"}`,
              opacity: isResolved ? 0.6 : 1,
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: "8px 12px", background: "var(--surface-card)" }}
            >
              <span style={{ fontSize: 12, color: "var(--body)", fontWeight: 500 }}>
                Edit {i + 1}
                {isAccepted && <span style={{ color: "var(--success)", marginLeft: 8 }}>Accepted</span>}
                {isRejected && <span style={{ color: "var(--error)", marginLeft: 8 }}>Rejected</span>}
              </span>

              {!isResolved && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAccept(i)}
                    className="flex items-center gap-1"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--r-sm)",
                      border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                      background: "color-mix(in srgb, var(--success) 6%, transparent)",
                      color: "var(--success)",
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--success) 12%, transparent)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--success) 6%, transparent)"; }}
                  >
                    <Check size={11} />
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(i)}
                    className="flex items-center gap-1"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--r-sm)",
                      border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
                      background: "color-mix(in srgb, var(--error) 6%, transparent)",
                      color: "var(--error)",
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--error) 12%, transparent)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--error) 6%, transparent)"; }}
                  >
                    <X size={11} />
                    Reject
                  </button>
                </div>
              )}
            </div>

            {/* Show diff preview */}
            <div
              className="font-mono"
              style={{
                fontSize: 12,
                lineHeight: 1.5,
                maxHeight: 80,
                overflow: "auto",
                padding: "8px 12px",
                background: "var(--canvas)",
              }}
            >
              {edit.oldText && (
                <div style={{ color: "var(--error)", textDecoration: "line-through", opacity: 0.7 }}>
                  {edit.oldText.slice(0, 100)}{edit.oldText.length > 100 ? "…" : ""}
                </div>
              )}
              {edit.newText && (
                <div style={{ color: "var(--success)" }}>
                  {edit.newText.slice(0, 100)}{edit.newText.length > 100 ? "…" : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
