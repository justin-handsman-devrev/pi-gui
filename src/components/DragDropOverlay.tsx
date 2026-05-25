import { useState, useCallback, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";

interface DragDropOverlayProps {
  children: ReactNode;
  onFilesDropped: (files: File[]) => void;
}

export default function DragDropOverlay({ children, onFilesDropped }: DragDropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesDropped(files);
    }
  }, [onFilesDropped]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex-1 flex flex-col min-h-0"
    >
      {children}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="drag-drop-overlay absolute inset-0 z-50 flex items-center justify-center"
            style={{
              border: "2px dashed var(--hairline-strong)",
              borderRadius: "var(--r-xl)",
              margin: 8,
            }}
          >
            <div className="text-center p-8">
              <Upload size={32} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>
                Drop files here
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                Images will be attached to your message
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
