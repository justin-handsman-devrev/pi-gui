import { getSessionStats } from "@/lib/tauri-commands";
import { useAgentStore } from "@/stores/agentStore";
import { useUsageStore } from "@/stores/usageStore";

export interface SessionTokenStats {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
  total: number;
}

export interface SessionContextUsage {
  tokens: number | null;
  contextWindow: number;
  percent: number | null;
}

export interface SessionStatsSnapshot {
  sessionId?: string;
  sessionFile?: string;
  userMessages?: number;
  assistantMessages?: number;
  toolCalls?: number;
  toolResults?: number;
  totalMessages?: number;
  tokens: SessionTokenStats;
  cost: number;
  contextUsage?: SessionContextUsage;
}

export function fmtTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function fmtSessionCost(cost: number): string {
  if (cost >= 1) return `$${cost.toFixed(2)}`;
  if (cost >= 0.01) return `$${cost.toFixed(2)}`;
  if (cost > 0) return `$${cost.toFixed(4)}`;
  return "$0.00";
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseSessionStats(raw: unknown): SessionStatsSnapshot | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const data = raw as Record<string, unknown>;
  const tokensRaw = data.tokens;
  if (!tokensRaw || typeof tokensRaw !== "object") return undefined;

  const tokensObj = tokensRaw as Record<string, unknown>;
  const tokens: SessionTokenStats = {
    input: asNumber(tokensObj.input),
    output: asNumber(tokensObj.output),
    total: asNumber(tokensObj.total),
  };

  if (typeof tokensObj.cacheRead === "number") {
    tokens.cacheRead = tokensObj.cacheRead;
  }
  if (typeof tokensObj.cacheWrite === "number") {
    tokens.cacheWrite = tokensObj.cacheWrite;
  }

  const snapshot: SessionStatsSnapshot = {
    tokens,
    cost: asNumber(data.cost),
  };

  if (typeof data.sessionId === "string") snapshot.sessionId = data.sessionId;
  if (typeof data.sessionFile === "string") snapshot.sessionFile = data.sessionFile;
  if (typeof data.userMessages === "number") snapshot.userMessages = data.userMessages;
  if (typeof data.assistantMessages === "number") snapshot.assistantMessages = data.assistantMessages;
  if (typeof data.toolCalls === "number") snapshot.toolCalls = data.toolCalls;
  if (typeof data.toolResults === "number") snapshot.toolResults = data.toolResults;
  if (typeof data.totalMessages === "number") snapshot.totalMessages = data.totalMessages;

  const usageRaw = data.contextUsage;
  if (usageRaw && typeof usageRaw === "object") {
    const usageObj = usageRaw as Record<string, unknown>;
    snapshot.contextUsage = {
      tokens: asNullableNumber(usageObj.tokens),
      contextWindow: asNumber(usageObj.contextWindow),
      percent: asNullableNumber(usageObj.percent),
    };
  }

  return snapshot;
}

export async function refreshSessionStats(): Promise<SessionStatsSnapshot | undefined> {
  try {
    const raw = await getSessionStats();
    const stats = parseSessionStats(raw);
    if (stats) {
      useAgentStore.getState().setSessionStats(stats);
      useUsageStore.getState().recordFromSnapshot(stats);
    }
    return stats;
  } catch (error: unknown) {
    console.warn("[session-stats] refresh failed:", error);
    return undefined;
  }
}
