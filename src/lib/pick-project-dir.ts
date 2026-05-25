const DEFAULT_CWD = "~/repos/pi-gui";

export const getDefaultProjectCwd = (): string => {
  const saved = localStorage.getItem("pi-gui-cwd");
  if (saved?.trim()) return saved.trim();
  return DEFAULT_CWD;
};

export const pickProjectDirectory = async (): Promise<string | null> => {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Choose project folder",
    });

    if (typeof selected === "string" && selected.trim()) {
      return selected.trim();
    }
    return null;
  } catch (err) {
    console.warn("[pickProjectDirectory] dialog unavailable:", err);
    return null;
  }
};
