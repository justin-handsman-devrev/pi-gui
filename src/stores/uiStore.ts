import { create } from "zustand";

export interface UIState {
  /** Whether the canvas / preview pane is visible. */
  canvasVisible: boolean;
  /** Horizontal split percentage (0–100) between chat and canvas. */
  canvasSplit: number;
  /** Whether the sidebar is expanded. */
  sidebarOpen: boolean;
  /** Currently active file tab in the canvas pane, if any. */
  activeFileTab: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setCanvasVisible: (v: boolean) => void;
  setCanvasSplit: (pct: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  setActiveFileTab: (tab: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  canvasVisible: false,
  canvasSplit: 50,
  sidebarOpen: true,
  activeFileTab: null,

  setCanvasVisible: (v) => set({ canvasVisible: v }),
  setCanvasSplit: (pct) => set({ canvasSplit: Math.max(10, Math.min(90, pct)) }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setActiveFileTab: (tab) => set({ activeFileTab: tab }),
}));
