import { create } from "zustand";
import type { DiffLine } from "@/lib/diff-parser";
import { getLanguageFromPath } from "@/lib/language-detect";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DiffInfo {
  toolCallId: string;
  diff: string; // unified diff text
  parsedLines: DiffLine[];
  firstChangedLine?: number;
}

export interface CanvasFileState {
  filePath: string;
  originalContent: string; // content before this turn's edits
  currentContent: string; // content after applied diffs
  diffs: DiffInfo[];
  language: string | undefined;
  isStreaming: boolean;
  lastEditToolCallId?: string;
}

export interface CanvasStore {
  files: Map<string, CanvasFileState>;
  tabOrder: string[]; // ordered file paths
  activeFilePath: string | null;

  // Actions
  addFile: (path: string, content: string) => void;
  updateFileContent: (path: string, content: string) => void;
  addDiff: (path: string, diff: DiffInfo) => void;
  setFileStreaming: (path: string, streaming: boolean) => void;
  setActiveFile: (path: string | null) => void;
  removeFile: (path: string) => void;
  clearAll: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasStore>((set) => ({
  files: new Map(),
  tabOrder: [],
  activeFilePath: null,

  addFile: (path, content) =>
    set((state) => {
      const files = new Map(state.files);
      const language = getLanguageFromPath(path);

      if (!files.has(path)) {
        files.set(path, {
          filePath: path,
          originalContent: content,
          currentContent: content,
          diffs: [],
          language,
          isStreaming: false,
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
      });
      return { files, activeFilePath: path };
    }),

  updateFileContent: (path, content) =>
    set((state) => {
      const files = new Map(state.files);
      const file = files.get(path);
      if (!file) return state;
      files.set(path, { ...file, currentContent: content });
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
        lastEditToolCallId: diff.toolCallId,
      });
      return { files };
    }),

  setFileStreaming: (path, streaming) =>
    set((state) => {
      const files = new Map(state.files);
      const file = files.get(path);
      if (!file) return state;
      files.set(path, { ...file, isStreaming: streaming });
      return { files };
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  removeFile: (path) =>
    set((state) => {
      const files = new Map(state.files);
      files.delete(path);
      const tabOrder = state.tabOrder.filter((p) => p !== path);
      let activeFilePath = state.activeFilePath;
      if (activeFilePath === path) {
        // Activate the next tab, or the previous one, or null
        const idx = state.tabOrder.indexOf(path);
        activeFilePath =
          tabOrder[Math.min(idx, tabOrder.length - 1)] ?? null;
      }
      return { files, tabOrder, activeFilePath };
    }),

  clearAll: () =>
    set({
      files: new Map(),
      tabOrder: [],
      activeFilePath: null,
    }),
}));
