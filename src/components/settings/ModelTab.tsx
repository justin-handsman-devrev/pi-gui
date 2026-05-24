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

/**
 * Provider badge styles using warm ink and aurora tones
 */
const PROVIDER_STYLES: Record<string, string> = {
  anthropic: "bg-[#d4a88c]/15 text-[#d4a88c] border-[#d4a88c]/25",
  openai: "bg-[#5fb8a3]/15 text-[#5fb8a3] border-[#5fb8a3]/25",
  google: "bg-[#9d8bb8]/15 text-[#9d8bb8] border-[#9d8bb8]/25",
  ollama: "bg-[#78716c]/15 text-[#a8a29e] border-[#78716c]/25",
  openrouter: "bg-[#c494a4]/15 text-[#c494a4] border-[#c494a4]/25",
};

const DEFAULT_PROVIDER_STYLE =
  "bg-[#44403c]/30 text-[#78716c] border-[#44403c]/40";

function providerStyle(provider: string) {
  const key = provider.toLowerCase();
  for (const [k, v] of Object.entries(PROVIDER_STYLES)) {
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
    <div className="animate-pulse rounded-lg border border-[#44403c]/30 bg-[#1c1917]/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-[#292524]" />
          <div className="h-4 w-28 rounded bg-[#292524]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-[#292524]" />
          <div className="h-4 w-14 rounded bg-[#292524]" />
        </div>
      </div>
    </div>
  );
}

// ── Thinking Level Selector (Segmented Pill) ─────────────────────────────────

interface ThinkingSelectorProps {
  currentLevel: string;
  onChange: (level: string) => void;
}

function ThinkingSelector({ currentLevel, onChange }: ThinkingSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-[#44403c]/30 p-0.5">
      {THINKING_LEVELS.map(({ value, label }) => {
        const isActive = currentLevel === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            className={`
              relative rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-150
              ${isActive ? "bg-[#292524] text-[#fafaf9]" : "text-[#78716c] hover:text-[#a8a29e]"}
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Model settings tab with ElevenLabs-inspired design:
 * - Warm ink backgrounds (#1c1917, #292524)
 * - Aurora accents for provider badges
 * - Pill-shaped segmented control for thinking levels
 * - Aurora-lavender accent for active model
 */
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
          <Sparkles size={16} className="text-[#9d8bb8]" />
          <h3 className="text-sm font-medium text-[#a8a29e]">Active Model</h3>
        </div>

        {model ? (
          <div className="flex items-center gap-3 rounded-lg border border-[#44403c]/40 bg-[#1c1917] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#9d8bb8]/15">
              <Cpu size={18} className="text-[#9d8bb8]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#fafaf9]">
                {model.id}
              </p>
              <span
                className={`mt-1 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${providerStyle(model.provider)}`
              }
              >
                {model.provider}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-[#44403c]/30 bg-[#1c1917]/50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#44403c]">
              <Cpu size={18} className="text-[#57534e]" />
            </div>
            <p className="text-sm text-[#57534e]">No model loaded</p>
          </div>
        )}
      </section>

      {/* ── Thinking Level ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className="text-[#9d8bb8]" />
          <h3 className="text-sm font-medium text-[#a8a29e]">Thinking Level</h3>
        </div>

        <ThinkingSelector
          currentLevel={storeThinkingLevel}
          onChange={handleThinkingLevel}
        />
      </section>

      {/* ── Available Models ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className="text-[#9d8bb8]" />
          <h3 className="text-sm font-medium text-[#a8a29e]">
            Available Models
          </h3>
          {loading && (
            <Loader2 size={14} className="animate-spin text-[#57534e]" />
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
          <div className="rounded-lg border border-[#c494a4]/20 bg-[#c494a4]/10 p-4">
            <p className="text-sm text-[#c494a4]">
              Failed to load models: {error}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && models.length === 0 && (
          <div className="rounded-lg border border-[#44403c]/30 bg-[#1c1917]/50 p-6 text-center">
            <Cpu size={24} className="mx-auto mb-2 text-[#57534e]" />
            <p className="text-sm text-[#57534e]">No models available</p>
            <p className="mt-1 text-xs text-[#44403c]">
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
                    group w-full rounded-lg border p-3 text-left
                    transition-colors duration-150
                    focus-visible:outline-2 focus-visible:outline-[#9d8bb8]
                    ${
                      isActive
                        ? "border-[#9d8bb8]/40 bg-[#9d8bb8]/5"
                        : "border-[#44403c]/30 bg-[#1c1917]/50 hover:border-[#44403c]/50 hover:bg-[#1c1917]"
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
                      <span className="truncate text-sm text-[#a8a29e] group-hover:text-[#fafaf9]">
                        {m.id}
                      </span>
                    </div>

                    {/* Right: meta badges */}
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded bg-[#44403c]/50 px-1.5 py-0.5 text-[10px] font-medium text-[#78716c] tabular-nums">
                        {formatContextWindow(m.contextWindow)} ctx
                      </span>

                      {m.reasoning && (
                        <span className="rounded bg-[#9d8bb8]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#9d8bb8]">
                          Reasoning
                        </span>
                      )}

                      {isSwitching ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#9d8bb8]"
                        />
                      ) : isActive ? (
                        <Check size={14} className="text-[#9d8bb8]" />
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
