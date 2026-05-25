import { create } from "zustand";
import { loadSettings, SETTINGS_STORAGE_KEY } from "@/lib/app-settings";

export type SidebarView =
  | "chats"
  | "projects"
  | "scheduled"
  | "activity"
  | "extensions"
  | "settings";

export type ExtensionsTab = "skills" | "agents" | "prompts" | "mcp";

export interface ProjectSession {
  id: string;
  name: string;
  cwd: string;
  lastActive: string; // ISO date
  messageCount: number;
}

export interface Project {
  name: string;
  path: string;
  sessions: ProjectSession[];
  lastActive: string;
}

export interface SettingsState {
  theme: "dark" | "light";
  fontSize: number;
  appZoom: number;
  canvasFontSize: number;
  showLineNumbers: boolean;
  canvasAutoOpen: boolean;
  compactMessages: boolean;
}

export interface UIState {
  canvasVisible: boolean;
  canvasSplit: number;
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeFileTab: string | null;
  sidebarView: SidebarView;
  extensionsTab: ExtensionsTab;
  settingsOpen: boolean;
  settings: SettingsState;
  projects: Project[];

  setCanvasVisible: (v: boolean) => void;
  setCanvasSplit: (pct: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  setSidebarView: (v: SidebarView) => void;
  setExtensionsTab: (v: ExtensionsTab) => void;
  setActiveFileTab: (tab: string | null) => void;
  setSettingsOpen: (v: boolean) => void;
  updateSettings: (partial: Partial<SettingsState>) => void;
  addProject: (project: Project) => void;
  removeProject: (path: string) => void;
}

// Initialize settings from localStorage
const initialSettings = loadSettings();

// Initialize projects from localStorage
const savedProjects = localStorage.getItem("pi-gui-projects");
const initialProjects: Project[] = savedProjects
  ? JSON.parse(savedProjects)
  : [];

export const useUIStore = create<UIState>((set) => ({
  canvasVisible: false,
  canvasSplit: 50,
  sidebarOpen: true,
  sidebarWidth: 260,
  activeFileTab: null,
  sidebarView: "chats",
  extensionsTab: "skills",
  settingsOpen: false,
  settings: initialSettings,
  projects: initialProjects,

  setCanvasVisible: (v) => set({ canvasVisible: v }),
  setCanvasSplit: (pct) =>
    set({ canvasSplit: Math.max(10, Math.min(90, pct)) }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setSidebarView: (v) => set({ sidebarView: v }),
  setExtensionsTab: (v) => set({ extensionsTab: v }),
  setActiveFileTab: (tab) => set({ activeFileTab: tab }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  updateSettings: (partial) =>
    set((s) => {
      const settings = { ...s.settings, ...partial };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      return { settings };
    }),
  addProject: (project) =>
    set((s) => {
      const projects = [
        ...s.projects.filter((p) => p.path !== project.path),
        project,
      ];
      localStorage.setItem("pi-gui-projects", JSON.stringify(projects));
      return { projects };
    }),
  removeProject: (path) =>
    set((s) => {
      const projects = s.projects.filter((p) => p.path !== path);
      localStorage.setItem("pi-gui-projects", JSON.stringify(projects));
      return { projects };
    }),
}));
