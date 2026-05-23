import { create } from "zustand";

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
  toolCalls: Record<string, ToolCallInfo>; // toolCallId → info
  sessionStats?: {
    tokens: { input: number; output: number; total: number };
    cost: number;
  };
  steeringQueue: string[];
  followUpQueue: string[];

  // ── Actions ────────────────────────────────────────────────────────────────
  addUserMessage: (text: string) => void;
  startAssistantMessage: () => void;
  updateAssistantText: (text: string) => void;
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
    sessionStats?: {
      tokens: { input: number; output: number; total: number };
      cost: number;
    };
  }) => void;
  setQueues: (steering: string[], followUp: string[]) => void;
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
  toolCalls: {} as Record<string, ToolCallInfo>,
  sessionStats: undefined as
    | {
        tokens: { input: number; output: number; total: number };
        cost: number;
      }
    | undefined,
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
      // text is the *full accumulated* content from the streaming update
      msgs[msgs.length - 1] = { ...last, content: text };
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
      const tc: ToolCallInfo = {
        toolCallId: id,
        toolName: name,
        args,
        status: "running",
      };
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
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
      return {
        toolCalls: { ...s.toolCalls, [id]: updated },
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
      sessionStats: info.sessionStats,
    }),

  setQueues: (steering, followUp) =>
    set({ steeringQueue: steering, followUpQueue: followUp }),

  // ── Reset ──────────────────────────────────────────────────────────────────

  reset: () => {
    messageCounter = 0;
    return set({ ...INITIAL_STATE });
  },
}));
