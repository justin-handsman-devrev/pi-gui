import { create } from "zustand";

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  expanded?: boolean;
  loading?: boolean;
}

export interface FileTreeState {
  tree: FileNode[];
  rootPath: string | null;
  selectedPath: string | null;

  setTree: (tree: FileNode[]) => void;
  setRootPath: (path: string | null) => void;
  setSelectedPath: (path: string | null) => void;
  toggleNode: (path: string) => void;
  setNodeChildren: (path: string, children: FileNode[]) => void;
  reset: () => void;
}

export const useFileTreeStore = create<FileTreeState>((set) => ({
  tree: [],
  rootPath: null,
  selectedPath: null,

  setTree: (tree) => set({ tree }),
  setRootPath: (path) => set({ rootPath: path }),
  setSelectedPath: (path) => set({ selectedPath: path }),

  toggleNode: (path) =>
    set((s) => ({
      tree: toggleInTree(s.tree, path),
    })),

  setNodeChildren: (path, children) =>
    set((s) => ({
      tree: updateChildren(s.tree, path, children),
    })),

  reset: () => set({ tree: [], rootPath: null, selectedPath: null }),
}));

function toggleInTree(nodes: FileNode[], targetPath: string): FileNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return { ...node, children: toggleInTree(node.children, targetPath) };
    }
    return node;
  });
}

function updateChildren(
  nodes: FileNode[],
  targetPath: string,
  children: FileNode[],
): FileNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return { ...node, children, loading: false };
    }
    if (node.children) {
      return {
        ...node,
        children: updateChildren(node.children, targetPath, children),
      };
    }
    return node;
  });
}
