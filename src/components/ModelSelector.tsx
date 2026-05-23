import { useState, useEffect, useRef, useCallback } from "react";
import {
  getAvailableModels,
  setModel as rpcSetModel,
  type ModelInfo,
} from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";

/**
 * Dropdown to select the active LLM model.
 *
 * Fetches available models on mount, shows them in a popover panel, and
 * calls the backend to switch on selection.
 */
export default function ModelSelector() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      try {
        const confirmed = await rpcSetModel(model.provider, model.id);
        storeSetModel(confirmed);
      } catch (err) {
        console.error("[ModelSelector] failed to set model:", err);
      } finally {
        setLoading(false);
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
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-dark-elevated hover:text-text-primary disabled:opacity-50"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <span className="max-w-[160px] truncate">{label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-dark-border bg-dark-elevated shadow-xl">
          <div className="max-h-64 overflow-y-auto p-1">
            {models.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-muted">
                No models available
              </div>
            ) : (
              models.map((model) => {
                const isActive =
                  currentModel?.provider === model.provider &&
                  currentModel?.id === model.id;
                return (
                  <button
                    key={`${model.provider}-${model.id}`}
                    onClick={() => handleSelect(model)}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs transition-colors hover:bg-dark-border"
                  >
                    {isActive ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="shrink-0 text-accent-green"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                    <span className={isActive ? "text-text-primary" : "text-text-secondary"}>
                      {formatModelLabel(model.provider, model.id)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatModelLabel(provider: string, modelId: string): string {
  // Turn "claude-sonnet-4-20250514" → "Claude Sonnet 4"
  const short = modelId
    .replace(/-\d{8}$/, "") // Remove date suffix
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return `${short} (${provider})`;
}
