import { useEffect } from "react";
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
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="ext-editor-backdrop" onClick={onCancel}>
      <div
        className="ext-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ext-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ext-editor-header">
          <h3 id="ext-editor-title" className="ext-editor-title">{title}</h3>
          <button type="button" className="ext-icon-btn" onClick={onCancel} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="ext-editor-body">
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

        <div className="ext-editor-footer">
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
        </div>
      </div>
    </div>
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
