import { create } from "zustand";
import type { SessionStatsSnapshot } from "@/lib/session-stats";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ToolCallInfo {
  toolCallId: string;
  toolName: string;
  args: unknown;
  result?: unknown;
  isError?: boolean;
  partialResult?: unknown;
  status: "running" | "completed" | "error";
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Pre-tool assistant text; hidden in UI once tool calls are present. */
  preamble?: string;
  thinking?: string | null;
  toolCalls: ToolCallInfo[];
  isStreaming: boolean;
}

export interface AgentState {
  // ── Data ───────────────────────────────────────────────────────────────────
  messages: Message[];
  isStreaming: boolean;
  isCompacting: boolean;
  model?: { provider: string; id: string };
  thinkingLevel: string;
  sessionId: string;
  sessionName?: string;
  sessionFile?: string;
  toolCalls: Record<string, ToolCallInfo>; // toolCallId → info
  sessionStats?: SessionStatsSnapshot;
  steeringQueue: string[];
  followUpQueue: string[];

  // ── Actions ────────────────────────────────────────────────────────────────
  addUserMessage: (text: string) => void;
  startAssistantMessage: () => void;
  updateAssistantText: (text: string) => void;
  updateAssistantContent: (payload: {
    thinking: string | null;
    preamble: string;
    response: string;
  }) => void;
  endAssistantMessage: () => void;
  startToolCall: (id: string, name: string, args: unknown) => void;
  updateToolCall: (id: string, partial: unknown) => void;
  endToolCall: (id: string, result: unknown, isError: boolean) => void;
  setStreaming: (v: boolean) => void;
  setCompacting: (v: boolean) => void;
  setModel: (model: { provider: string; id: string }) => void;
  setThinkingLevel: (level: string) => void;
  setSessionInfo: (info: {
    sessionId: string;
    sessionName?: string;
    sessionFile?: string;
  }) => void;
  setSessionStats: (stats: SessionStatsSnapshot | undefined) => void;
  loadSession: (payload: {
    sessionId: string;
    sessionName?: string;
    sessionFile?: string;
    model?: { provider: string; id: string };
    thinkingLevel?: string;
    sessionStats?: SessionStatsSnapshot;
    messages: Message[];
  }) => void;
  setQueues: (steering: string[], followUp: string[]) => void;
  appendSteeringMessage: (message: string) => void;
  appendFollowUpMessage: (message: string) => void;
  reset: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let messageCounter = 0;
const nextMsgId = () => `msg-${++messageCounter}`;

const INITIAL_STATE = {
  messages: [] as Message[],
  isStreaming: false,
  isCompacting: false,
  model: undefined as
    | { provider: string; id: string }
    | undefined,
  thinkingLevel: "medium",
  sessionId: "",
  sessionName: undefined as string | undefined,
  sessionFile: undefined as string | undefined,
  toolCalls: {} as Record<string, ToolCallInfo>,
  sessionStats: undefined as SessionStatsSnapshot | undefined,
  steeringQueue: [] as string[],
  followUpQueue: [] as string[],
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useAgentStore = create<AgentState>((set) => ({
  ...INITIAL_STATE,

  // ── Messages ───────────────────────────────────────────────────────────────

  addUserMessage: (text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: nextMsgId(),
          role: "user",
          content: text,
          toolCalls: [],
          isStreaming: false,
        },
      ],
    })),

  startAssistantMessage: () =>
    set((s) => {
      // If the last message is already a streaming assistant message, reuse it
      const last = s.messages[s.messages.length - 1];
      if (last?.role === "assistant" && last.isStreaming) return s;

      return {
        messages: [
          ...s.messages,
          {
            id: nextMsgId(),
            role: "assistant",
            content: "",
            toolCalls: [],
            isStreaming: true,
          },
        ],
      };
    }),

  updateAssistantText: (text) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (!last || last.role !== "assistant") return s;
      msgs[msgs.length - 1] = { ...last, content: text, preamble: "" };
      return { messages: msgs };
    }),

  updateAssistantContent: ({ thinking, preamble, response }) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (!last || last.role !== "assistant") return s;
      msgs[msgs.length - 1] = {
        ...last,
        thinking,
        preamble,
        content: response,
      };
      return { messages: msgs };
    }),

  endAssistantMessage: () =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (!last || last.role !== "assistant") return s;
      msgs[msgs.length - 1] = { ...last, isStreaming: false };
      return { messages: msgs };
    }),

  // ── Tool calls ─────────────────────────────────────────────────────────────

  startToolCall: (id, name, args) =>
    set((s) => {
      const existing = s.toolCalls[id];
      if (existing) {
        const msgs = s.messages.map((m) => {
          if (m.role !== "assistant") return m;
          const idx = m.toolCalls.findIndex((tc) => tc.toolCallId === id);
          if (idx === -1) return m;
          const tcs = [...m.toolCalls];
          tcs[idx] = { ...existing, toolName: name, args };
          return { ...m, toolCalls: tcs };
        });
        return {
          toolCalls: { ...s.toolCalls, [id]: { ...existing, toolName: name, args } },
          messages: msgs,
        };
      }

      const tc: ToolCallInfo = {
        toolCallId: id,
        toolName: name,
        args,
        status: "running",
      };
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        if (last.toolCalls.some((existingTc) => existingTc.toolCallId === id)) {
          return s;
        }
        msgs[msgs.length - 1] = {
          ...last,
          toolCalls: [...last.toolCalls, tc],
        };
      }
      return {
        toolCalls: { ...s.toolCalls, [id]: tc },
        messages: msgs,
      };
    }),

  updateToolCall: (id, partial) =>
    set((s) => {
      const existing = s.toolCalls[id];
      if (!existing) return s;
      const updated: ToolCallInfo = { ...existing, partialResult: partial };
      const msgs = s.messages.map((m) => {
        if (m.role !== "assistant") return m;
        const idx = m.toolCalls.findIndex((tc) => tc.toolCallId === id);
        if (idx === -1) return m;
        const tcs = [...m.toolCalls];
        tcs[idx] = updated;
        return { ...m, toolCalls: tcs };
      });
      return {
        toolCalls: { ...s.toolCalls, [id]: updated },
        messages: msgs,
      };
    }),

  endToolCall: (id, result, isError) =>
    set((s) => {
      const existing = s.toolCalls[id];
      if (!existing) return s;
      const updated: ToolCallInfo = {
        ...existing,
        result,
        isError,
        status: isError ? "error" : "completed",
      };
      // Also update the tool call inside the message that holds it
      const msgs = s.messages.map((m) => {
        if (m.role !== "assistant") return m;
        const idx = m.toolCalls.findIndex((tc) => tc.toolCallId === id);
        if (idx === -1) return m;
        const tcs = [...m.toolCalls];
        tcs[idx] = updated;
        return { ...m, toolCalls: tcs };
      });
      return {
        toolCalls: { ...s.toolCalls, [id]: updated },
        messages: msgs,
      };
    }),

  // ── Simple setters ─────────────────────────────────────────────────────────

  setStreaming: (v) => set({ isStreaming: v }),
  setCompacting: (v) => set({ isCompacting: v }),
  setModel: (model) => set({ model }),
  setThinkingLevel: (level) => set({ thinkingLevel: level }),

  setSessionInfo: (info) =>
    set({
      sessionId: info.sessionId,
      sessionName: info.sessionName,
      sessionFile: info.sessionFile,
    }),

  setSessionStats: (stats) => set({ sessionStats: stats }),

  loadSession: (payload) => {
    messageCounter = payload.messages.length;
    return set({
      messages: payload.messages,
      sessionId: payload.sessionId,
      sessionName: payload.sessionName,
      sessionFile: payload.sessionFile,
      model: payload.model,
      thinkingLevel: payload.thinkingLevel ?? "medium",
      sessionStats: payload.sessionStats,
      isStreaming: false,
      isCompacting: false,
      toolCalls: {},
      steeringQueue: [],
      followUpQueue: [],
    });
  },

  setQueues: (steering, followUp) =>
    set({ steeringQueue: steering, followUpQueue: followUp }),

  appendSteeringMessage: (message) =>
    set((s) => ({
      steeringQueue: [...s.steeringQueue, message],
    })),

  appendFollowUpMessage: (message) =>
    set((s) => ({
      followUpQueue: [...s.followUpQueue, message],
    })),

  // ── Reset ──────────────────────────────────────────────────────────────────

  reset: () => {
    messageCounter = 0;
    return set({ ...INITIAL_STATE });
  },
}));
