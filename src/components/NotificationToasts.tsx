import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP = {
  success: { bg: "color-mix(in srgb, var(--success) 8%, transparent)", border: "color-mix(in srgb, var(--success) 20%, transparent)", icon: "var(--success)" },
  error: { bg: "color-mix(in srgb, var(--error) 8%, transparent)", border: "color-mix(in srgb, var(--error) 20%, transparent)", icon: "var(--error)" },
  warning: { bg: "color-mix(in srgb, var(--warning) 8%, transparent)", border: "color-mix(in srgb, var(--warning) 20%, transparent)", icon: "var(--warning)" },
  info: { bg: "color-mix(in srgb, var(--accent-mint) 8%, transparent)", border: "color-mix(in srgb, var(--accent-mint) 20%, transparent)", icon: "var(--accent-mint)" },
};

function Toast({
  id,
  type,
  title,
  message,
  duration,
}: {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}) {
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const Icon = ICON_MAP[type];
  const colors = COLOR_MAP[type];

  const dismiss = useCallback(() => {
    removeNotification(id);
  }, [id, removeNotification]);

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(dismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-start gap-3 w-80"
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${colors.border}`,
        borderRadius: "var(--r-lg)",
        padding: "12px 16px",
        boxShadow: "var(--shadow-hover)",
        pointerEvents: "auto",
      }}
    >
      <Icon size={16} style={{ color: colors.icon, flexShrink: 0, marginTop: 4 }} />
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}>
          {title}
        </div>
        {message && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
            {message}
          </div>
        )}
      </div>
      <button
        onClick={dismiss}
        className="hover-ghost"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--muted-soft)",
          padding: 4,
          flexShrink: 0,
        }}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

export default function NotificationToasts() {
  const notifications = useNotificationStore((s) => s.notifications);

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2"
      style={{ pointerEvents: "none" }}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <Toast key={n.id} {...n} />
        ))}
      </AnimatePresence>
    </div>
  );
}
