import { listDirectory } from "@/lib/tauri-commands";
import { useFileTreeStore, type FileNode } from "@/stores/fileTreeStore";

function mapEntries(
  entries: Awaited<ReturnType<typeof listDirectory>>,
): FileNode[] {
  return entries.map((entry) => ({
    name: entry.name,
    path: entry.path,
    isDirectory: entry.isDirectory,
  }));
}

export async function initFileTree(rootPath: string): Promise<void> {
  const trimmed = rootPath.trim();
  const store = useFileTreeStore.getState();

  if (!trimmed) {
    store.reset();
    return;
  }

  store.setRootPath(trimmed);

  try {
    const entries = await listDirectory(trimmed);
    store.setTree(mapEntries(entries));
  } catch {
    store.setTree([]);
  }
}

export async function loadDirectoryChildren(path: string): Promise<FileNode[]> {
  const entries = await listDirectory(path);
  return mapEntries(entries);
}
