import { useState, useEffect } from "react";
import { Cpu, Sparkles, Loader2, Check } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import {
  getAvailableModels,
  setModel,
  setThinkingLevel,
  type ModelInfo,
} from "@/lib/tauri-commands";

// ── Constants ────────────────────────────────────────────────────────────────

const THINKING_LEVELS = [
  { value: "off", label: "Off" },
  { value: "minimal", label: "Min" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "XHigh" },
] as const;

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  openai: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  google: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  ollama: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  openrouter: "bg-purple-500/15 text-purple-400 border-purple-500/25",
};

const DEFAULT_PROVIDER_STYLE =
  "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";

function providerStyle(provider: string) {
  const key = provider.toLowerCase();
  for (const [k, v] of Object.entries(PROVIDER_COLORS)) {
    if (key.includes(k)) return v;
  }
  return DEFAULT_PROVIDER_STYLE;
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return String(tokens);
}

// ── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-zinc-700" />
          <div className="h-4 w-28 rounded bg-zinc-700" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-zinc-700" />
          <div className="h-4 w-14 rounded bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ModelTab() {
  const model = useAgentStore((s) => s.model);
  const storeThinkingLevel = useAgentStore((s) => s.thinkingLevel);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  // ── Fetch available models on mount ────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAvailableModels()
      .then((res) => {
        if (!cancelled) {
          setModels(res.models ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleThinkingLevel = async (level: string) => {
    try {
      await setThinkingLevel(level);
      useAgentStore.getState().setThinkingLevel(level);
    } catch {
      // Silently fail — store won't update so the pill reverts
    }
  };

  const handleSelectModel = async (info: ModelInfo) => {
    const key = `${info.provider}:${info.id}`;
    if (switchingTo === key) return;
    setSwitchingTo(key);

    try {
      const result = await setModel(info.provider, info.id);
      useAgentStore.getState().setModel(result);
    } catch {
      // Silently fail — active model card stays unchanged
    } finally {
      setSwitchingTo(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Active Model Card ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">Active Model</h3>
        </div>

        {model ? (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
              <Cpu size={18} className="text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-100">
                {model.id}
              </p>
              <span
                className={`mt-1 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${providerStyle(model.provider)}`}
              >
                {model.provider}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-700">
              <Cpu size={18} className="text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-500">No model loaded</p>
          </div>
        )}
      </section>

      {/* ── Thinking Level ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className="text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">Thinking Level</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {THINKING_LEVELS.map(({ value, label }) => {
            const isActive = storeThinkingLevel === value;
            return (
              <button
                key={value}
                onClick={() => handleThinkingLevel(value)}
                aria-pressed={isActive}
                className={`
                  rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150
                  focus-visible:outline-2 focus-visible:outline-violet-500
                  ${
                    isActive
                      ? "bg-violet-500 text-white shadow-sm shadow-violet-500/25"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                  }
                `}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Available Models ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className="text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">
            Available Models
          </h3>
          {loading && (
            <Loader2 size={14} className="animate-spin text-zinc-500" />
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">
              Failed to load models: {error}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && models.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-6 text-center">
            <Cpu size={24} className="mx-auto mb-2 text-zinc-600" />
            <p className="text-sm text-zinc-500">No models available</p>
            <p className="mt-1 text-xs text-zinc-600">
              Check your provider configuration and API keys.
            </p>
          </div>
        )}

        {/* Model list */}
        {!loading && !error && models.length > 0 && (
          <div className="space-y-2">
            {models.map((m) => {
              const key = `${m.provider}:${m.id}`;
              const isActive =
                model?.provider === m.provider && model?.id === m.id;
              const isSwitching = switchingTo === key;

              return (
                <button
                  key={key}
                  onClick={() => handleSelectModel(m)}
                  disabled={isSwitching}
                  className={`
                    group w-full rounded-lg border bg-zinc-800/50 p-3 text-left
                    transition-colors duration-150
                    focus-visible:outline-2 focus-visible:outline-violet-500
                    ${
                      isActive
                        ? "border-violet-500/40 bg-violet-500/5"
                        : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
                    }
                    ${isSwitching ? "opacity-60 cursor-wait" : "cursor-pointer"}
                  `}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Left: badges + name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${providerStyle(m.provider)}`}
                      >
                        {m.provider}
                      </span>
                      <span className="truncate text-sm text-zinc-200 group-hover:text-zinc-100">
                        {m.id}
                      </span>
                    </div>

                    {/* Right: meta badges */}
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 tabular-nums">
                        {formatContextWindow(m.contextWindow)} ctx
                      </span>

                      {m.reasoning && (
                        <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400">
                          Reasoning
                        </span>
                      )}

                      {isSwitching ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-violet-400"
                        />
                      ) : isActive ? (
                        <Check size={14} className="text-violet-400" />
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
