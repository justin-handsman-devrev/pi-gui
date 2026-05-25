import type { ReactNode } from "react";

export function ExtensionToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`ext-toggle${checked ? " is-on" : ""}`}
    />
  );
}

export function ExtensionStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "error";
}) {
  return (
    <div className={`ext-stat ext-stat-${tone}`}>
      <span className="ext-stat-value">{value}</span>
      <span className="ext-stat-label">{label}</span>
    </div>
  );
}

export function ExtensionEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="ext-empty">
      <p className="ext-empty-title">{title}</p>
      <p className="ext-empty-desc">{description}</p>
      {action}
    </div>
  );
}

export function prefillChatPrompt(text: string): void {
  window.dispatchEvent(new CustomEvent("pi:prefill-prompt", { detail: { text } }));
}
