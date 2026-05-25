import { PanelRightOpen } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

export default function CanvasToggle() {
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);

  return (
    <button
      type="button"
      onClick={() => setCanvasVisible(true)}
      className="canvas-toggle-fab"
      title="Show canvas (⇧⌘C)"
      aria-label="Show canvas"
    >
      <PanelRightOpen size={15} strokeWidth={1.75} />
    </button>
  );
}
