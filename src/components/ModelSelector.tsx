import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ChevronDown, Check, Loader2 } from "lucide-react";
import {
  getAvailableModels,
  setModel as rpcSetModel,
  type ModelInfo,
} from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";

// ── Provider colors ──────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "bg-orange-500/15 text-orange-400",
  openai: "bg-emerald-500/15 text-emerald-400",
  google: "bg-blue-500/15 text-blue-400",
  xai: "bg-zinc-500/15 text-zinc-400",
};

function providerBadgeClass(provider: string): string {
  const key = provider.toLowerCase();
  for (const [pattern, cls] of Object.entries(PROVIDER_COLORS)) {
    if (key.includes(pattern)) return cls;
  }
  return "bg-zinc-700/50 text-zinc-400";
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
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
      >
        <Cpu size={13} />
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl"
          >
            <div className="max-h-72 overflow-y-auto p-1">
              {models.length === 0 ? (
                <div className="px-3 py-3 text-xs text-zinc-500">
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
                        flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors duration-150
                        ${
                          isActive
                            ? "bg-violet-500/10 text-violet-300"
                            : "text-zinc-300 hover:bg-zinc-700/60"
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {isActive ? (
                        <Check size={14} className="shrink-0 text-violet-400" />
                      ) : isSwitching ? (
                        <Loader2
                          size={14}
                          className="shrink-0 animate-spin text-violet-400"
                        />
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}

                      {/* Model info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">
                            {formatModelLabel(model.provider, model.id)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`inline-flex rounded px-1 py-px text-[10px] font-medium ${providerBadgeClass(model.provider)}`}
                          >
                            {model.provider}
                          </span>
                          {model.contextWindow > 0 && (
                            <span className="text-[10px] text-zinc-600">
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
