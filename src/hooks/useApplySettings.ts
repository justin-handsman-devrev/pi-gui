import { useEffect } from "react";
import { applySettings } from "@/lib/app-settings";
import { useUIStore } from "@/stores/uiStore";

/** Sync persisted settings to CSS variables and document attributes. */
export function useApplySettings(): void {
  const settings = useUIStore((s) => s.settings);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);
}
