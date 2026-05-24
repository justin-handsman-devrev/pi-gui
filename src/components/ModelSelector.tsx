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
const PROVIDER_STYLES: Record<string, string> = {
  anthropic: "bg-[#d4a88c]/15 text-[#d4a88c]",
  openai: "bg-[#5fb8a3]/15 text-[#5fb8a3]",
  google: "bg-[#9d8bb8]/15 text-[#9d8bb8]",
  xai: "bg-[#78716c]/15 text-[#78716c]",
};

function providerBadgeClass(provider: string): string {
  const key = provider.toLowerCase();
  for (const [pattern, cls] of Object.entries(PROVIDER_STYLES)) {
    if (key.includes(pattern)) return cls;
  }
  return "bg-[#44403c]/50 text-[#57534e]";
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
          flex items-center justify-between gap-2
          w-64
          px-4 py-2.5
          rounded-full
          bg-[#131210]
          border border-[rgba(255,255,255,0.06)]
          text-[14px] text-[#fafaf9]
          hover:border-[rgba(255,255,255,0.10)]
          transition-colors duration-150
          disabled:opacity-50
        "
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          size={14}
          className={`text-[#78716c] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1c1917] shadow-xl"
          >
            <div className="max-h-72 overflow-y-auto p-1.5">
              {models.length === 0 ? (
                <div className="px-3 py-3 text-xs text-[#57534e]">
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
                      className={`
                        flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150
                        ${
                          isActive
                            ? "bg-[#9d8bb8]/10 text-[#fafaf9]"
                            : "text-[#a8a29e] hover:bg-[#44403c]/40 hover:text-[#fafaf9]"
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {isActive ? (
                        <Check size={14} className="shrink-0 text-[#9d8bb8]" />
                      ) : isSwitching ? (
                        <Loader2
                          size={14}
                          className="shrink-0 animate-spin text-[#9d8bb8]"
                        />
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}

                      {/* Model info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-[13px]">
                            {formatModelLabel(model.provider, model.id)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`inline-flex rounded px-1.5 py-px text-[10px] font-medium ${providerBadgeClass(model.provider)}`}
                          >
                            {model.provider}
                          </span>
                          {model.contextWindow > 0 && (
                            <span className="text-[10px] text-[#57534e]">
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