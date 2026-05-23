import { invoke } from "@tauri-apps/api/core";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ModelInfo {
  provider: string;
  id: string;
  contextWindow: number;
  reasoning: boolean;
}

export interface RpcSessionState {
  model?: { provider: string; id: string };
  thinkingLevel: string;
  isStreaming: boolean;
  isCompacting: boolean;
  sessionId: string;
  sessionName?: string;
  sessionStats?: {
    tokens: { input: number; output: number; total: number };
    cost: number;
  };
}

export interface CompactionResult {
  success: boolean;
  message?: string;
  tokensSaved?: number;
}

// ── Command wrappers ─────────────────────────────────────────────────────────

/** Start the agent loop in the given working directory. */
export const startAgent = (cwd: string): Promise<void> =>
  invoke("start_agent", { cwd });

/** Send a user prompt to the running agent. */
export const sendPrompt = (message: string): Promise<void> =>
  invoke("send_prompt", { message });

/** Inject a steering / mid-stream instruction. */
export const steer = (message: string): Promise<void> =>
  invoke("steer", { message });

/** Abort the currently running agent turn. */
export const abortAgent = (): Promise<void> => invoke("abort_agent");

/** Create a new session. Resolves with `{ cancelled: boolean }`. */
export const newSession = (): Promise<{ cancelled: boolean }> =>
  invoke("new_session");

/** Fetch the full session state from the Rust backend. */
export const getState = (): Promise<RpcSessionState> =>
  invoke("get_state");

/** Switch the active model. */
export const setModel = (
  provider: string,
  modelId: string,
): Promise<{ provider: string; id: string }> =>
  invoke("set_model", { provider, modelId });

/** List models available to the user. */
export const getAvailableModels = (): Promise<{ models: ModelInfo[] }> =>
  invoke("get_available_models");

/** Change the thinking / reasoning level (e.g. "none", "low", "high"). */
export const setThinkingLevel = (level: string): Promise<void> =>
  invoke("set_thinking_level", { level });

/** Compact / summarise the session context to save tokens. */
export const compactSession = (): Promise<CompactionResult> =>
  invoke("compact_session");
