import { useCallback } from "react";
import { FileText, FileJson } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import { useNotificationStore } from "@/stores/notificationStore";

export default function ExportButton() {
  const messages = useAgentStore((s) => s.messages);
  const sessionName = useAgentStore((s) => s.sessionName);
  const model = useAgentStore((s) => s.model);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const exportMarkdown = useCallback(() => {
    if (messages.length === 0) return;

    const lines: string[] = [
      `# ${sessionName || "Pi Chat Export"}`,
      "",
      `Exported: ${new Date().toLocaleString()}`,
      model ? `Model: ${model.provider}/${model.id}` : "",
      "",
      "---",
      "",
    ];

    for (const msg of messages) {
      const role = msg.role === "user" ? "**You**" : "**Pi**";
      lines.push(`### ${role}`);
      lines.push("");
      lines.push(msg.content);
      lines.push("");

      if (msg.toolCalls.length > 0) {
        lines.push("#### Tool Calls");
        lines.push("");
        for (const tc of msg.toolCalls) {
          lines.push(`- **${tc.toolName}**: ${tc.status}`);
          if (tc.result && typeof tc.result === "string") {
            lines.push(`  \`\`\`\n  ${tc.result.slice(0, 500)}\n  \`\`\``);
          }
        }
        lines.push("");
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    downloadBlob(blob, `${(sessionName || "chat").replace(/\s+/g, "-")}.md`);
    addNotification({ type: "success", title: "Exported as Markdown" });
  }, [messages, sessionName, model, addNotification]);

  const exportJSON = useCallback(() => {
    if (messages.length === 0) return;

    const data = {
      sessionName,
      model,
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls.map((tc) => ({
          toolName: tc.toolName,
          status: tc.status,
          args: tc.args,
          result: tc.result,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, `${(sessionName || "chat").replace(/\s+/g, "-")}.json`);
    addNotification({ type: "success", title: "Exported as JSON" });
  }, [messages, sessionName, model, addNotification]);

  if (messages.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={exportMarkdown}
        className="btn-ghost"
        style={{ height: 28, fontSize: 12, padding: "0 8px", gap: 4, borderRadius: "var(--r-sm)" }}
        title="Export as Markdown"
      >
        <FileText size={12} />
        MD
      </button>
      <button
        onClick={exportJSON}
        className="btn-ghost"
        style={{ height: 28, fontSize: 12, padding: "0 8px", gap: 4, borderRadius: "var(--r-sm)" }}
        title="Export as JSON"
      >
        <FileJson size={12} />
        JSON
      </button>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
