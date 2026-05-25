import { Minus, Plus } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import {
  CANVAS_FONT_MAX,
  CANVAS_FONT_MIN,
  clampCanvasFontSize,
} from "@/canvas/canvas-font";

export default function CanvasFontControls() {
  const canvasFontSize = useUIStore((s) => s.settings.canvasFontSize);
  const updateSettings = useUIStore((s) => s.updateSettings);

  const setSize = (next: number) => {
    updateSettings({ canvasFontSize: clampCanvasFontSize(next) });
  };

  return (
    <div className="canvas-font-controls" aria-label="Canvas font size">
      <button
        type="button"
        className="canvas-header-btn"
        onClick={() => setSize(canvasFontSize - 1)}
        disabled={canvasFontSize <= CANVAS_FONT_MIN}
        title="Decrease font size"
        aria-label="Decrease font size"
      >
        <Minus size={12} />
      </button>
      <span className="canvas-font-size-label">{canvasFontSize}px</span>
      <button
        type="button"
        className="canvas-header-btn"
        onClick={() => setSize(canvasFontSize + 1)}
        disabled={canvasFontSize >= CANVAS_FONT_MAX}
        title="Increase font size"
        aria-label="Increase font size"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
