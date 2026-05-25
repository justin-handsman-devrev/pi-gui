export const CWD_KEY = "pi-gui-cwd";

export function getActiveProjectCwd(): string {
  return localStorage.getItem(CWD_KEY) || "";
}

export function setActiveProjectCwd(cwd: string): void {
  localStorage.setItem(CWD_KEY, cwd.trim());
}

export function normalizeProjectPath(path: string): string {
  return path.trim().replace(/\/$/, "");
}

export function isSameProjectPath(a: string, b: string): boolean {
  const left = normalizeProjectPath(a);
  const right = normalizeProjectPath(b);
  return left.length > 0 && left === right;
}
