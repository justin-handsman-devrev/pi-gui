import { create } from "zustand";
import type { SessionStatsSnapshot } from "@/lib/session-stats";
import { useAgentStore } from "@/stores/agentStore";

const STORAGE_KEY = "pi-gui-usage";

export interface TrackedSessionUsage {
  sessionId: string;
  sessionName: string;
  modelLabel?: string;
  updatedAt: number;
  input: number;
  output: number;
  total: number;
  cost: number;
  contextTokens: number | null;
  contextWindow: number;
  contextPercent: number | null;
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
}

export interface UsageAggregate {
  sessions: number;
  input: number;
  output: number;
  total: number;
  cost: number;
}

interface UsageState {
  bySession: Record<string, TrackedSessionUsage>;
  recordFromSnapshot: (stats: SessionStatsSnapshot) => void;
  clearHistory: () => void;
}

function readFromStorage(): Record<string, TrackedSessionUsage> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TrackedSessionUsage>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeToStorage(bySession: Record<string, TrackedSessionUsage>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bySession));
}

function modelLabel(model?: { provider: string; id: string }): string | undefined {
  if (!model) return undefined;
  return `${model.provider}/${model.id}`;
}

function toTrackedUsage(
  sessionId: string,
  stats: SessionStatsSnapshot,
  sessionName: string,
  model?: { provider: string; id: string },
): TrackedSessionUsage {
  return {
    sessionId,
    sessionName,
    modelLabel: modelLabel(model),
    updatedAt: Date.now(),
    input: stats.tokens.input,
    output: stats.tokens.output,
    total: stats.tokens.total,
    cost: stats.cost,
    contextTokens: stats.contextUsage?.tokens ?? null,
    contextWindow: stats.contextUsage?.contextWindow ?? 0,
    contextPercent: stats.contextUsage?.percent ?? null,
    userMessages: stats.userMessages ?? 0,
    assistantMessages: stats.assistantMessages ?? 0,
    toolCalls: stats.toolCalls ?? 0,
  };
}

export function computeUsageAggregate(
  bySession: Record<string, TrackedSessionUsage>,
): UsageAggregate {
  const sessions = Object.values(bySession);
  return sessions.reduce<UsageAggregate>(
    (acc, session) => ({
      sessions: acc.sessions + 1,
      input: acc.input + session.input,
      output: acc.output + session.output,
      total: acc.total + session.total,
      cost: acc.cost + session.cost,
    }),
    { sessions: 0, input: 0, output: 0, total: 0, cost: 0 },
  );
}

export const useUsageStore = create<UsageState>((set) => ({
  bySession: readFromStorage(),

  recordFromSnapshot: (stats) => {
    const agent = useAgentStore.getState();
    const sessionId = stats.sessionId || agent.sessionId;
    if (!sessionId) return;

    const record = toTrackedUsage(
      sessionId,
      stats,
      agent.sessionName || "Untitled chat",
      agent.model,
    );

    set((state) => {
      const bySession = { ...state.bySession, [sessionId]: record };
      writeToStorage(bySession);
      return { bySession };
    });
  },

  clearHistory: () => {
    writeToStorage({});
    set({ bySession: {} });
  },
}));
