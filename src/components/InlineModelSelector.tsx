import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Loader2, Cpu, Sparkles } from "lucide-react";
import {
  getAvailableModels,
  setModel as rpcSetModel,
  type ModelInfo,
} from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";
import { fullModelLabel } from "@/lib/model-name";

function formatModelLabel(_provider: string, modelId: string): string {
  const short = modelId.replace(/-\d{8}$/, "").split("/").pop() ?? modelId;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}k`;
  return String(tokens);
}

interface InlineModelSelectorProps {
  variant?: "inline" | "footer";
}

export default function InlineModelSelector({ variant = "inline" }: InlineModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const currentModel = useAgentStore((s) => s.model);
  const storeSetModel = useAgentStore((s) => s.setModel);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchModels = useCallback(async () => {
    if (models.length > 0) return;
    setLoading(true);
    try {
      const result = await getAvailableModels();
      if (result.models) setModels(result.models);
    } catch (err) {
      console.error("[InlineModelSelector] failed:", err);
    } finally {
      setLoading(false);
    }
  }, [models.length]);

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

  const handleOpen = useCallback(() => {
    setOpen((v) => {
      if (!v) fetchModels();
      return !v;
    });
  }, [fetchModels]);

  const handleSelect = useCallback(async (model: ModelInfo) => {
    const key = `${model.provider}-${model.id}`;
    setSwitchingTo(key);
    try {
      const confirmed = await rpcSetModel(model.provider, model.id);
      storeSetModel(confirmed);
    } catch (err) {
      console.error("[InlineModelSelector] set model failed:", err);
    } finally {
      setSwitchingTo(null);
      setOpen(false);
    }
  }, [storeSetModel]);

  const grouped = models.reduce<Record<string, ModelInfo[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  const label = currentModel
    ? variant === "footer"
      ? fullModelLabel(currentModel.provider, currentModel.id)
      : formatModelLabel(currentModel.provider, currentModel.id)
    : "Select model";

  const triggerClass = variant === "footer" ? "app-footer-control app-footer-model" : "";

  return (
    <div ref={containerRef} className={`relative min-w-0${variant === "footer" ? "" : " shrink"}`}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={triggerClass || undefined}
        title={currentModel ? `${currentModel.provider}/${currentModel.id}` : "Select model"}
        style={
          variant === "inline"
            ? {
                background: "var(--surface-strong)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--r-pill)",
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--body-strong)",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }
            : undefined
        }
        onMouseEnter={
          variant === "inline"
            ? (e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--hairline-strong)";
              }
            : undefined
        }
        onMouseLeave={
          variant === "inline"
            ? (e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--hairline)";
              }
            : undefined
        }
      >
        <Cpu size={12} style={{ color: "var(--muted-soft)", flexShrink: 0 }} />
        <span
          className={variant === "footer" ? "app-footer-model-label" : "truncate"}
          style={variant === "inline" ? { maxWidth: 120 } : undefined}
        >
          {label}
        </span>
        {loading ? (
          <Loader2 size={12} className="animate-spin shrink-0" />
        ) : (
          <ChevronDown
            size={12}
            className="shrink-0 transition-transform duration-150"
            style={{ transform: open ? "rotate(180deg)" : undefined, color: "var(--muted-soft)" }}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="app-footer-menu app-footer-model-menu"
            style={{ width: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ maxHeight: 280, overflowY: "auto", padding: 6 }}>
              {models.length === 0 && !loading && (
                <div style={{ padding: 12, textAlign: "center", color: "var(--muted-soft)", fontSize: 12 }}>
                  No models available
                </div>
              )}
              {Object.entries(grouped).map(([provider, providerModels]) => (
                <div key={provider}>
                  <div className="type-label" style={{ padding: "6px 10px", fontSize: 10 }}>
                    {provider}
                  </div>
                  {providerModels.map((model) => {
                    const isActive =
                      currentModel?.provider === model.provider && currentModel?.id === model.id;
                    const isSwitching = switchingTo === `${model.provider}-${model.id}`;

                    return (
                      <button
                        key={`${model.provider}-${model.id}`}
                        type="button"
                        onClick={() => handleSelect(model)}
                        className="app-footer-menu-item"
                      >
                        {isActive ? (
                          <Check size={12} style={{ color: "var(--accent-lavender)", flexShrink: 0 }} />
                        ) : isSwitching ? (
                          <Loader2 size={12} className="animate-spin shrink-0" />
                        ) : (
                          <span style={{ width: 12, flexShrink: 0 }} />
                        )}
                        <span className="flex-1 text-left" style={{ wordBreak: "break-word" }}>
                          {fullModelLabel(model.provider, model.id)}
                        </span>
                        {model.contextWindow > 0 && (
                          <span style={{ fontSize: 10, color: "var(--muted-soft)" }}>
                            {formatContext(model.contextWindow)}
                          </span>
                        )}
                        {model.reasoning && (
                          <Sparkles size={10} style={{ color: "var(--grad-lavender)" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

