import { useEffect, useMemo, useState } from "react";
import { Check, Cpu, Loader2, Sparkles } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import {
  getAvailableModels,
  setModel,
  setThinkingLevel,
  type ModelInfo,
} from "@/lib/tauri-commands";
import { ExtensionStat } from "@/components/extensions/extension-ui";
import { SegmentedControl, SettingSection } from "./settings-ui";

const THINKING_LEVELS = [
  { value: "off", label: "Off" },
  { value: "minimal", label: "Min" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Max" },
] as const;

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return String(tokens);
}

function providerKey(provider: string): string {
  const lower = provider.toLowerCase();
  if (lower.includes("anthropic")) return "anthropic";
  if (lower.includes("openai")) return "openai";
  if (lower.includes("google")) return "google";
  if (lower.includes("ollama")) return "ollama";
  if (lower.includes("openrouter")) return "openrouter";
  return "default";
}

function SkeletonCard() {
  return <div className="settings-model-skeleton" />;
}

export default function ModelTab() {
  const model = useAgentStore((s) => s.model);
  const storeThinkingLevel = useAgentStore((s) => s.thinkingLevel);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return models;
    return models.filter(
      (entry) =>
        entry.id.toLowerCase().includes(needle)
        || entry.provider.toLowerCase().includes(needle),
    );
  }, [models, query]);

  const reasoningCount = models.filter((entry) => entry.reasoning).length;

  const handleThinkingLevel = async (level: string) => {
    try {
      await setThinkingLevel(level);
      useAgentStore.getState().setThinkingLevel(level);
    } catch {
      // Store stays unchanged on failure
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
      // Active model unchanged on failure
    } finally {
      setSwitchingTo(null);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-hero-card">
        <div className="settings-hero-icon">
          <Sparkles size={18} strokeWidth={1.75} />
        </div>
        <div className="settings-hero-copy">
          <p className="settings-hero-label">Active model</p>
          {model ? (
            <>
              <p className="settings-hero-value">{model.id}</p>
              <span className={`settings-provider-chip is-${providerKey(model.provider)}`}>
                {model.provider}
              </span>
            </>
          ) : (
            <p className="settings-hero-empty">No model loaded</p>
          )}
        </div>
      </div>

      <div className="ext-stats-row settings-stats-row">
        <ExtensionStat label="Available" value={loading ? "…" : models.length} />
        <ExtensionStat label="Reasoning" value={loading ? "…" : reasoningCount} />
        <ExtensionStat label="Thinking" value={storeThinkingLevel} />
      </div>

      <SettingSection title="Thinking level" description="Extended reasoning depth for supported models.">
        <SegmentedControl
          value={storeThinkingLevel}
          options={THINKING_LEVELS.map((level) => ({
            value: level.value,
            label: level.label,
          }))}
          onChange={(level) => void handleThinkingLevel(level)}
        />
      </SettingSection>

      <SettingSection title="Model catalog" description="Select which model the agent uses for this session.">
        <div className="settings-search-wrap">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search models…"
            className="ext-search-input"
          />
        </div>

        {loading && (
          <div className="settings-model-list">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && error && (
          <div className="settings-error">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="settings-empty">
            <Cpu size={20} />
            <p>No models match your search.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="settings-model-list">
            {filtered.map((entry) => {
              const key = `${entry.provider}:${entry.id}`;
              const isActive = model?.provider === entry.provider && model?.id === entry.id;
              const isSwitching = switchingTo === key;

              return (
                <button
                  key={key}
                  type="button"
                  className={`settings-model-card${isActive ? " is-active" : ""}`}
                  onClick={() => void handleSelectModel(entry)}
                  disabled={isSwitching}
                >
                  <div className="settings-model-card-main">
                    <span className={`settings-provider-chip is-${providerKey(entry.provider)}`}>
                      {entry.provider}
                    </span>
                    <span className="settings-model-name">{entry.id}</span>
                  </div>
                  <div className="settings-model-meta">
                    <span className="settings-model-ctx">{formatContextWindow(entry.contextWindow)} ctx</span>
                    {entry.reasoning && <span className="settings-model-badge">Reasoning</span>}
                    {isSwitching ? (
                      <Loader2 size={14} className="animate-spin settings-model-check" />
                    ) : isActive ? (
                      <Check size={14} className="settings-model-check" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SettingSection>
    </div>
  );
}
