import { create } from "zustand";
import type { DiffLine } from "@/lib/diff-parser";
import { getLanguageFromPath } from "@/lib/language-detect";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DiffInfo {
  toolCallId: string;
  diff: string; // raw unified diff text
  parsedLines: DiffLine[];
  firstChangedLine?: number;
}

export interface CanvasFileState {
  filePath: string;
  originalContent: string; // content before this turn's edits
  currentContent: string; // latest content (updated on write or after edit applied)
  diffs: DiffInfo[]; // accumulated diffs for this file
  language: string | undefined; // highlight.js language id
  isStreaming: boolean;
  lastUpdated: number; // Date.now() of last mutation
}

export type CanvasViewMode = "code" | "diff";

export interface CanvasStore {
  files: Map<string, CanvasFileState>;
  tabOrder: string[]; // ordered file paths
  activeFilePath: string | null;
  viewMode: CanvasViewMode;

  // Actions
  openFile: (path: string, content: string) => void;
  updateFileContent: (path: string, content: string) => void;
  addDiff: (path: string, diff: DiffInfo) => void;
  setStreaming: (path: string, streaming: boolean) => void;
  setActiveFile: (path: string | null) => void;
  closeFile: (path: string) => void;
  setViewMode: (mode: CanvasViewMode) => void;
  clearAll: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasStore>((set) => ({
  files: new Map(),
  tabOrder: [],
  activeFilePath: null,
  viewMode: "code",

  openFile: (path, content) =>
    set((state) => {
      const files = new Map(state.files);
      const language = getLanguageFromPath(path);
      const now = Date.now();

      if (!files.has(path)) {
        files.set(path, {
          filePath: path,
          originalContent: content,
          currentContent: content,
          diffs: [],
          language,
          isStreaming: false,
          lastUpdated: now,
        });
        return {
          files,
          tabOrder: [...state.tabOrder, path],
          activeFilePath: path,
        };
      }

      // File already tracked — update content
      const existing = files.get(path)!;
      files.set(path, {
        ...existing,
        currentContent: content,
        lastUpdated: now,
      });
      return { files, activeFilePath: path };
    }),

  updateFileContent: (path, content) =>
    set((state) => {
      const files = new Map(state.files);
      const file = files.get(path);
      if (!file) return state;
      files.set(path, { ...file, currentContent: content, lastUpdated: Date.now() });
      return { files };
    }),

  addDiff: (path, diff) =>
    set((state) => {
      const files = new Map(state.files);
      const file = files.get(path);
      if (!file) return state;
      files.set(path, {
        ...file,
        diffs: [...file.diffs, diff],
        lastUpdated: Date.now(),
      });
      return { files };
    }),

  setStreaming: (path, streaming) =>
    set((state) => {
      const files = new Map(state.files);
      const file = files.get(path);
      if (!file) return state;
      files.set(path, { ...file, isStreaming: streaming, lastUpdated: Date.now() });
      return { files };
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  closeFile: (path) =>
    set((state) => {
      const files = new Map(state.files);
      files.delete(path);
      const tabOrder = state.tabOrder.filter((p) => p !== path);
      let activeFilePath = state.activeFilePath;
      if (activeFilePath === path) {
        const idx = state.tabOrder.indexOf(path);
        activeFilePath = tabOrder[Math.min(idx, tabOrder.length - 1)] ?? null;
      }
      return { files, tabOrder, activeFilePath };
    }),

  setViewMode: (mode) => set({ viewMode: mode }),

  clearAll: () =>
    set({
      files: new Map(),
      tabOrder: [],
      activeFilePath: null,
    }),
}));
