import { create } from "zustand";
import {
  DEFAULT_AGENTS,
  DEFAULT_MCP_SERVERS,
  DEFAULT_PROMPTS,
  type AgentProfile,
  type McpServerConfig,
  type PromptTemplate,
} from "@/lib/extensions-defaults";

const STORAGE_KEY = "pi-gui-extensions";

interface PersistedExtensions {
  agents: AgentProfile[];
  prompts: PromptTemplate[];
  mcpServers: McpServerConfig[];
}

interface ExtensionsState extends PersistedExtensions {
  load: () => void;
  resetToDefaults: () => void;
  addAgent: (agent: AgentProfile) => void;
  updateAgent: (agent: AgentProfile) => void;
  deleteAgent: (id: string) => void;
  addPrompt: (prompt: PromptTemplate) => void;
  updatePrompt: (prompt: PromptTemplate) => void;
  deletePrompt: (id: string) => void;
  addMcpServer: (server: McpServerConfig) => void;
  updateMcpServer: (server: McpServerConfig) => void;
  deleteMcpServer: (id: string) => void;
}

function readFromStorage(): PersistedExtensions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        agents: DEFAULT_AGENTS,
        prompts: DEFAULT_PROMPTS,
        mcpServers: DEFAULT_MCP_SERVERS,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedExtensions>;
    return {
      agents: parsed.agents?.length ? parsed.agents : DEFAULT_AGENTS,
      prompts: parsed.prompts?.length ? parsed.prompts : DEFAULT_PROMPTS,
      mcpServers: parsed.mcpServers?.length ? parsed.mcpServers : DEFAULT_MCP_SERVERS,
    };
  } catch {
    return {
      agents: DEFAULT_AGENTS,
      prompts: DEFAULT_PROMPTS,
      mcpServers: DEFAULT_MCP_SERVERS,
    };
  }
}

function writeToStorage(data: PersistedExtensions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const initial = readFromStorage();

export const useExtensionsStore = create<ExtensionsState>((set, get) => ({
  agents: initial.agents,
  prompts: initial.prompts,
  mcpServers: initial.mcpServers,

  load: () => set(readFromStorage()),

  resetToDefaults: () => {
    const data: PersistedExtensions = {
      agents: DEFAULT_AGENTS,
      prompts: DEFAULT_PROMPTS,
      mcpServers: DEFAULT_MCP_SERVERS,
    };
    writeToStorage(data);
    set(data);
  },

  addAgent: (agent) => {
    const agents = [...get().agents, agent];
    writeToStorage({ ...get(), agents });
    set({ agents });
  },

  updateAgent: (agent) => {
    const agents = get().agents.map((entry) => (entry.id === agent.id ? agent : entry));
    writeToStorage({ ...get(), agents });
    set({ agents });
  },

  deleteAgent: (id) => {
    const agents = get().agents.filter((entry) => entry.id !== id);
    writeToStorage({ ...get(), agents });
    set({ agents });
  },

  addPrompt: (prompt) => {
    const prompts = [...get().prompts, prompt];
    writeToStorage({ ...get(), prompts });
    set({ prompts });
  },

  updatePrompt: (prompt) => {
    const prompts = get().prompts.map((entry) => (entry.id === prompt.id ? prompt : entry));
    writeToStorage({ ...get(), prompts });
    set({ prompts });
  },

  deletePrompt: (id) => {
    const prompts = get().prompts.filter((entry) => entry.id !== id);
    writeToStorage({ ...get(), prompts });
    set({ prompts });
  },

  addMcpServer: (server) => {
    const mcpServers = [...get().mcpServers, server];
    writeToStorage({ ...get(), mcpServers });
    set({ mcpServers });
  },

  updateMcpServer: (server) => {
    const mcpServers = get().mcpServers.map((entry) =>
      entry.id === server.id ? server : entry,
    );
    writeToStorage({ ...get(), mcpServers });
    set({ mcpServers });
  },

  deleteMcpServer: (id) => {
    const mcpServers = get().mcpServers.filter((entry) => entry.id !== id);
    writeToStorage({ ...get(), mcpServers });
    set({ mcpServers });
  },
}));
