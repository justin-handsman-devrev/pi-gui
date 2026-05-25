import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { setThinkingLevel as rpcSetThinkingLevel } from "@/lib/tauri-commands";

export type ThinkingLevel = "minimal" | "low" | "medium" | "high" | "xhigh";

export const THINKING_LEVELS: ThinkingLevel[] = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
];

const LEVEL_LABELS: Record<ThinkingLevel, string> = {
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
};

interface ThinkingLevelDropdownProps {
  disabled?: boolean;
  onLevelChange?: (level: ThinkingLevel) => void;
}

export default function ThinkingLevelDropdown({
  disabled = false,
  onLevelChange,
}: ThinkingLevelDropdownProps) {
  const currentLevel = useAgentStore((s) => s.thinkingLevel);
  const storeSetLevel = useAgentStore((s) => s.setThinkingLevel);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalized = currentLevel.toLowerCase();
  const activeLevel = THINKING_LEVELS.find((level) => level === normalized) ?? "medium";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback(
    async (level: ThinkingLevel) => {
      if (pending || disabled) return;
      setPending(true);
      try {
        await rpcSetThinkingLevel(level);
        storeSetLevel(level);
        onLevelChange?.(level);
        setOpen(false);
      } catch (err) {
        console.error("[ThinkingLevelDropdown] failed:", err);
      } finally {
        setPending(false);
      }
    },
    [disabled, onLevelChange, pending, storeSetLevel],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled || pending}
        className="app-footer-control"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{LEVEL_LABELS[activeLevel]}</span>
        {pending ? (
          <Loader2 size={12} className="animate-spin shrink-0" />
        ) : (
          <ChevronDown
            size={12}
            className="shrink-0 transition-transform duration-150"
            style={{ transform: open ? "rotate(180deg)" : undefined }}
          />
        )}
      </button>

      {open && (
        <div
          className="app-footer-menu"
          role="listbox"
          aria-label="Thinking level"
        >
          {THINKING_LEVELS.map((level) => {
            const selected = activeLevel === level;
            return (
              <button
                key={level}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(level)}
                className="app-footer-menu-item"
              >
                {selected ? (
                  <Check size={12} className="shrink-0" style={{ color: "var(--accent-lavender)" }} />
                ) : (
                  <span className="w-3 shrink-0" />
                )}
                <span>{LEVEL_LABELS[level]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
