import { Minus, Plus } from "lucide-react";
import { APP_ZOOM_DEFAULT, APP_ZOOM_MAX, APP_ZOOM_MIN, APP_ZOOM_STEP, clampAppZoom } from "@/lib/app-settings";
import { useUIStore } from "@/stores/uiStore";

interface AppZoomControlProps {
  variant?: "footer" | "settings";
}

export default function AppZoomControl({ variant = "footer" }: AppZoomControlProps) {
  const appZoom = useUIStore((s) => s.settings.appZoom);
  const updateSettings = useUIStore((s) => s.updateSettings);

  const setZoom = (next: number) => {
    updateSettings({ appZoom: clampAppZoom(next) });
  };

  const className = variant === "settings" ? "settings-zoom" : "app-zoom-controls";

  return (
    <div className={className} aria-label="App zoom">
      <button
        type="button"
        className={variant === "settings" ? "settings-zoom-btn" : "app-footer-icon-btn"}
        onClick={() => setZoom(appZoom - APP_ZOOM_STEP)}
        disabled={appZoom <= APP_ZOOM_MIN}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <Minus size={12} />
      </button>
      <span className={variant === "settings" ? "settings-zoom-value" : "app-zoom-label"}>
        {appZoom}%
      </span>
      <button
        type="button"
        className={variant === "settings" ? "settings-zoom-btn" : "app-footer-icon-btn"}
        onClick={() => setZoom(appZoom + APP_ZOOM_STEP)}
        disabled={appZoom >= APP_ZOOM_MAX}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <Plus size={12} />
      </button>
      {variant === "settings" && appZoom !== APP_ZOOM_DEFAULT && (
        <button
          type="button"
          className="settings-zoom-reset"
          onClick={() => setZoom(APP_ZOOM_DEFAULT)}
        >
          Reset
        </button>
      )}
    </div>
  );
}
