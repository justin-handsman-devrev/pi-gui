import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X } from "lucide-react";

export type EditorFieldType = "text" | "textarea" | "select" | "checkbox" | "tags";

export interface EditorField {
  key: string;
  label: string;
  type: EditorFieldType;
  placeholder?: string;
  hint?: string;
  rows?: number;
  options?: string[];
  required?: boolean;
}

interface ExtensionEditorModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  fields: EditorField[];
  values: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  saving?: boolean;
}

export function ExtensionEditorModal({
  open,
  title,
  subtitle,
  fields,
  values,
  onChange,
  onSave,
  onCancel,
  onDelete,
  saveLabel = "Save",
  saving = false,
}: ExtensionEditorModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="ext-editor-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            aria-label="Close editor"
          />

          <motion.aside
            className="ext-editor-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ext-editor-title"
          >
            <div className="settings-panel-bg" aria-hidden="true">
              <div className="orb orb-lavender settings-panel-orb settings-panel-orb-a" />
              <div className="orb orb-peach settings-panel-orb settings-panel-orb-b" />
            </div>

            <header className="settings-panel-top">
              <div className="settings-panel-top-copy">
                <h2 id="ext-editor-title" className="settings-panel-title">{title}</h2>
                {subtitle && (
                  <p className="settings-panel-subtitle">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                className="ext-icon-btn"
                onClick={onCancel}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </header>

            <div className="ext-editor-panel-body">
              {fields.map((field) => {
                const value = values[field.key];

                if (field.type === "checkbox") {
                  return (
                    <label key={field.key} className="ext-editor-check">
                      <input
                        type="checkbox"
                        checked={value === true}
                        onChange={(event) => onChange(field.key, event.target.checked)}
                      />
                      <span>{field.label}</span>
                    </label>
                  );
                }

                if (field.type === "select") {
                  return (
                    <label key={field.key} className="ext-editor-field">
                      <span className="ext-editor-label">{field.label}</span>
                      <select
                        className="ext-editor-input"
                        value={typeof value === "string" ? value : ""}
                        onChange={(event) => onChange(field.key, event.target.value)}
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {field.hint && <span className="ext-editor-hint">{field.hint}</span>}
                    </label>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <label key={field.key} className="ext-editor-field">
                      <span className="ext-editor-label">{field.label}</span>
                      <textarea
                        className="ext-editor-textarea"
                        rows={field.rows ?? 4}
                        placeholder={field.placeholder}
                        value={typeof value === "string" ? value : ""}
                        onChange={(event) => onChange(field.key, event.target.value)}
                      />
                      {field.hint && <span className="ext-editor-hint">{field.hint}</span>}
                    </label>
                  );
                }

                return (
                  <label key={field.key} className="ext-editor-field">
                    <span className="ext-editor-label">{field.label}</span>
                    <input
                      type="text"
                      className="ext-editor-input"
                      placeholder={field.placeholder}
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => onChange(field.key, event.target.value)}
                    />
                    {field.hint && <span className="ext-editor-hint">{field.hint}</span>}
                  </label>
                );
              })}
            </div>

            <footer className="ext-editor-footer">
              {onDelete && (
                <button
                  type="button"
                  className="ext-editor-delete"
                  onClick={onDelete}
                  disabled={saving}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
              <div className="ext-editor-footer-actions">
                <button type="button" className="skills-btn-secondary" onClick={onCancel} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="skills-btn-primary" onClick={onSave} disabled={saving}>
                  {saveLabel}
                </button>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function ExtensionItemActions({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  return (
    <div className="ext-item-actions">
      <button type="button" className="ext-text-btn" onClick={onEdit}>
        {editLabel}
      </button>
      <button type="button" className="ext-text-btn ext-text-btn-danger" onClick={onDelete}>
        {deleteLabel}
      </button>
    </div>
  );
}

export function confirmExtensionDelete(label: string): boolean {
  return window.confirm(`Delete "${label}"? This cannot be undone.`);
}
