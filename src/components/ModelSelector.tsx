import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import {
  getAvailableModels,
  setModel as rpcSetModel,
  type ModelInfo,
} from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";

/**
 * Provider badge styles using warm ink and aurora tones
 */
const PROVIDER_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  anthropic: { bg: "var(--accent-peach)", color: "var(--accent-peach)", border: "var(--accent-peach)" },
  openai: { bg: "var(--accent-mint)", color: "var(--accent-mint)", border: "var(--accent-mint)" },
  google: { bg: "var(--accent-lavender)", color: "var(--accent-lavender)", border: "var(--accent-lavender)" },
  xai: { bg: "var(--accent-slate)", color: "var(--accent-slate)", border: "var(--accent-slate)" },
};

function providerBadgeClass(provider: string): React.CSSProperties {
  const key = provider.toLowerCase();
  let s = { bg: "var(--hairline-strong)", color: "var(--muted)", border: "var(--hairline-strong)" };
  for (const [pattern, style] of Object.entries(PROVIDER_STYLES)) {
    if (key.includes(pattern)) { s = style; break; }
  }
  return {
    background: `color-mix(in srgb, ${s.bg} 15%, transparent)`,
    color: s.color,
    border: `1px solid color-mix(in srgb, ${s.border} 25%, transparent)`,
    borderRadius: "var(--r-sm)",
    padding: "4px 8px",
    fontSize: 10,
    fontWeight: 500,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatModelLabel(_provider: string, modelId: string): string {
  const short = modelId
    .replace(/-\d{8}$/, "")
    .split("/")
    .pop() ?? modelId;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}k`;
  return String(tokens);
}

// ── Component ────────────────────────────────────────────────────────────

/**
 * Model selector with ElevenLabs-inspired design:
 * - Pill-shaped trigger button
 * - Elevated menu with hairline border
 * - Aurora lavender (#9d8bb8) accent for selected items
 * - Hover states on ink-700 (#44403c)
 */
export default function ModelSelector() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const currentModel = useAgentStore((s) => s.model);
  const storeSetModel = useAgentStore((s) => s.setModel);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch models on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getAvailableModels();
        if (!cancelled && result.models) {
          setModels(result.models);
        }
      } catch (err) {
        console.error("[ModelSelector] failed to fetch models:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback(
    async (model: ModelInfo) => {
      const key = `${model.provider}-${model.id}`;
      setSwitchingTo(key);
      setLoading(true);
      try {
        const confirmed = await rpcSetModel(model.provider, model.id);
        storeSetModel(confirmed);
      } catch (err) {
        console.error("[ModelSelector] failed to set model:", err);
      } finally {
        setLoading(false);
        setSwitchingTo(null);
        setOpen(false);
      }
    },
    [storeSetModel],
  );

  const label = currentModel
    ? formatModelLabel(currentModel.provider, currentModel.id)
    : "Select model";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger - pill shaped */}
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="
          hover-hairline flex items-center justify-between gap-2
          w-64
          px-4 py-2.5
          transition-colors duration-150
          disabled:opacity-50
        "
        style={{
          borderRadius: "var(--r-pill)",
          background: "var(--surface-card)",
          border: "1px solid var(--hairline)",
          color: "var(--ink)",
          fontSize: 14,
        }}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          size={14}
          className="transition-transform duration-150"
          style={{
            color: "var(--muted-soft)",
            transform: open ? "rotate(180deg)" : "rotate(0)",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-1.5 w-80 overflow-hidden"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--r-xl)",
              boxShadow: "var(--shadow-hover)",
            }}
          >
            <div style={{ maxHeight: 288, overflowY: "auto", padding: 8 }}>
              {models.length === 0 ? (
                <div style={{ padding: 12, textAlign: "center", color: "var(--muted-soft)", fontSize: 12 }}>
                  No models available
                </div>
              ) : (
                models.map((model) => {
                  const isActive =
                    currentModel?.provider === model.provider &&
                    currentModel?.id === model.id;
                  const isSwitching =
                    switchingTo === `${model.provider}-${model.id}`;

                  return (
                    <button
                      key={`${model.provider}-${model.id}`}
                      onClick={() => handleSelect(model)}
                      className="hover-surface flex w-full items-center gap-3 text-left transition-colors duration-150"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--r-md)",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        background: isActive ? "color-mix(in srgb, var(--accent-lavender) 10%, transparent)" : "transparent",
                        color: isActive ? "var(--ink)" : "var(--body)",
                        width: "100%",
                      }}
                    >
                      {/* Active indicator */}
                      {isActive ? (
                        <Check size={14} className="shrink-0" style={{ color: "var(--accent-lavender)" }} />
                      ) : isSwitching ? (
                        <Loader2
                          size={14}
                          className="shrink-0 animate-spin"
                          style={{ color: "var(--accent-lavender)" }}
                        />
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}

                      {/* Model info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                            {formatModelLabel(model.provider, model.id)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className="inline-flex"
                            style={providerBadgeClass(model.provider)}
                          >
                            {model.provider}
                          </span>
                          {model.contextWindow > 0 && (
                            <span style={{ fontSize: 10, color: "var(--muted-soft)" }}>
                              {formatContextWindow(model.contextWindow)} ctx
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}