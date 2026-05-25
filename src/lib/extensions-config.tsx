import type { ReactNode } from "react";
import { Bot, BookOpen, Plug, Puzzle } from "lucide-react";
import type { ExtensionsTab } from "@/stores/uiStore";

export interface ExtensionTabDef {
  id: ExtensionsTab;
  label: string;
  description: string;
  icon: ReactNode;
}

export const EXTENSION_TABS: ExtensionTabDef[] = [
  {
    id: "skills",
    label: "Skills",
    description: "Agent skills and specialized capabilities",
    icon: <Puzzle size={14} strokeWidth={1.75} />,
  },
  {
    id: "agents",
    label: "Agents",
    description: "Subagents and orchestration profiles",
    icon: <Bot size={14} strokeWidth={1.75} />,
  },
  {
    id: "prompts",
    label: "Prompts",
    description: "Reusable prompt library and templates",
    icon: <BookOpen size={14} strokeWidth={1.75} />,
  },
  {
    id: "mcp",
    label: "MCP",
    description: "Model Context Protocol servers and tools",
    icon: <Plug size={14} strokeWidth={1.75} />,
  },
];

export const getExtensionTab = (id: ExtensionsTab): ExtensionTabDef =>
  EXTENSION_TABS.find((tab) => tab.id === id) ?? EXTENSION_TABS[0];
