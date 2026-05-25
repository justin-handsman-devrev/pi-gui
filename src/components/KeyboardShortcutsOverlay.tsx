import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ShortcutDef } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsOverlayProps {
  shortcuts: ShortcutDef[];
}

export default function KeyboardShortcutsOverlay({ shortcuts }: KeyboardShortcutsOverlayProps) {
  const [open, setOpen] = useState(false);

  // Listen for toggle events
  useState(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener("pi:toggle-shortcuts", handler);
    return () => window.removeEventListener("pi:toggle-shortcuts", handler);
  });

  const close = useCallback(() => setOpen(false), []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="keyboard-shortcuts-backdrop fixed inset-0 z-[150]"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 z-[151] w-full max-w-md"
            style={{
              transform: "translate(-50%, -50%)",
              background: "var(--surface-card)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--r-xxl)",
              boxShadow: "var(--shadow-hover)",
              padding: "var(--sp-6)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: "var(--sp-4)" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 300,
                  color: "var(--ink)",
                }}
              >
                Keyboard Shortcuts
              </h2>
              <button
                onClick={close}
                className="btn-ghost h-7 w-7 p-0"
                style={{ borderRadius: "var(--r-sm)" }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Shortcuts grid */}
            <div className="space-y-1">
              {shortcuts.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between"
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--hairline-soft)",
                  }}
                >
                  <span style={{ fontSize: 14, color: "var(--body)", letterSpacing: "0.15px" }}>{s.description}</span>
                  <kbd
                    className="keyboard-shortcuts-kbd font-mono"
                    style={{
                      background: "var(--surface-strong)",
                      border: "1px solid var(--hairline)",
                      borderRadius: "var(--r-sm)",
                      padding: "4px 8px",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--body-strong)",
                      minWidth: 28,
                      textAlign: "center",
                    }}
                  >
                    {s.label}
                  </kbd>
                </div>
              ))}
            </div>

            <p
              className="mt-4 text-center"
              style={{ fontSize: 12, color: "var(--muted-soft)", letterSpacing: "0.1px" }}
            >
              Press <kbd
                className="font-mono"
                style={{
                  fontSize: 11,
                  background: "var(--surface-strong)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--r-xs)",
                  padding: "4px 8px",
                }}
              >⌘/</kbd> to toggle this overlay
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
