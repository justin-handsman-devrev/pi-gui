import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  Plug,
  Power,
  PowerOff,
  RefreshCw,
  Wrench,
} from "lucide-react";
import {
  confirmExtensionDelete,
  ExtensionEditorModal,
  type EditorField,
} from "@/components/extensions/ExtensionEditorModal";
import { ExtensionStat } from "@/components/extensions/extension-ui";
import {
  formatMcpTools,
  newExtensionId,
  parseMcpTools,
  type McpServerConfig,
} from "@/lib/extensions-defaults";
import { useExtensionsStore } from "@/stores/extensionsStore";

type McpStatus = "connected" | "disconnected" | "error" | "connecting";

interface RuntimeMcpServer extends McpServerConfig {
  status: McpStatus;
}

const MCP_FIELDS: EditorField[] = [
  { key: "name", label: "Name", type: "text", required: true, placeholder: "github" },
  { key: "description", label: "Description", type: "textarea", rows: 2, required: true },
  { key: "command", label: "Command", type: "text", required: true, placeholder: "mcp-github" },
  { key: "docsUrl", label: "Docs URL", type: "text", placeholder: "https://…" },
  {
    key: "tools",
    label: "Tools",
    type: "textarea",
    rows: 6,
    hint: "One tool per line: name or name | description",
    placeholder: "search_code | Search code across repos",
  },
  { key: "autoConnect", label: "Auto-connect on startup", type: "checkbox" },
];

const emptyMcpForm = (): Record<string, string | boolean> => ({
  name: "",
  description: "",
  command: "",
  docsUrl: "",
  tools: "",
  autoConnect: false,
});

const serverToForm = (server: McpServerConfig): Record<string, string | boolean> => ({
  name: server.name,
  description: server.description,
  command: server.command,
  docsUrl: server.docsUrl ?? "",
  tools: formatMcpTools(server.tools),
  autoConnect: server.autoConnect === true,
});

function statusTone(status: McpStatus): "default" | "success" | "warning" | "error" {
  if (status === "connected") return "success";
  if (status === "connecting") return "warning";
  if (status === "error") return "error";
  return "default";
}

function statusLabel(status: McpStatus): string {
  if (status === "connected") return "Connected";
  if (status === "connecting") return "Connecting";
  if (status === "error") return "Error";
  return "Offline";
}

function initialStatus(server: McpServerConfig): McpStatus {
  return server.autoConnect ? "connected" : "disconnected";
}

export default function McpTab({ embedded = false }: { embedded?: boolean }) {
  const mcpServers = useExtensionsStore((s) => s.mcpServers);
  const load = useExtensionsStore((s) => s.load);
  const addMcpServer = useExtensionsStore((s) => s.addMcpServer);
  const updateMcpServer = useExtensionsStore((s) => s.updateMcpServer);
  const deleteMcpServer = useExtensionsStore((s) => s.deleteMcpServer);

  const [runtimeStatus, setRuntimeStatus] = useState<Record<string, McpStatus>>({});
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(emptyMcpForm());

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setRuntimeStatus((prev) => {
      const next = { ...prev };
      for (const server of mcpServers) {
        if (!next[server.id]) {
          next[server.id] = initialStatus(server);
        }
      }
      for (const id of Object.keys(next)) {
        if (!mcpServers.some((server) => server.id === id)) {
          delete next[id];
        }
      }
      return next;
    });
  }, [mcpServers]);

  const servers: RuntimeMcpServer[] = useMemo(
    () =>
      mcpServers.map((server) => ({
        ...server,
        status: runtimeStatus[server.id] ?? initialStatus(server),
      })),
    [mcpServers, runtimeStatus],
  );

  const connectedCount = servers.filter((server) => server.status === "connected").length;
  const errorCount = servers.filter((server) => server.status === "error").length;
  const totalTools = servers.reduce(
    (sum, server) => sum + (server.status === "connected" ? server.tools.length : 0),
    0,
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyMcpForm());
    setEditorOpen(true);
  };

  const openEdit = (server: McpServerConfig) => {
    setEditingId(server.id);
    setForm(serverToForm(server));
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const name = String(form.name).trim();
    const description = String(form.description).trim();
    const command = String(form.command).trim();
    if (!name || !description || !command) return;

    const payload: McpServerConfig = {
      id: editingId ?? newExtensionId(),
      name,
      description,
      command,
      docsUrl: String(form.docsUrl).trim() || undefined,
      tools: parseMcpTools(String(form.tools)),
      autoConnect: form.autoConnect === true,
    };

    if (editingId) {
      updateMcpServer(payload);
    } else {
      addMcpServer(payload);
      setRuntimeStatus((prev) => ({
        ...prev,
        [payload.id]: payload.autoConnect ? "connected" : "disconnected",
      }));
    }
    closeEditor();
  };

  const handleDelete = () => {
    if (!editingId) return;
    const server = mcpServers.find((entry) => entry.id === editingId);
    if (!server || !confirmExtensionDelete(server.name)) return;
    deleteMcpServer(editingId);
    closeEditor();
  };

  const toggleConnection = (serverId: string) => {
    const server = servers.find((entry) => entry.id === serverId);
    if (!server || server.status === "connecting") return;

    if (server.status === "connected") {
      setRuntimeStatus((prev) => ({ ...prev, [serverId]: "disconnected" }));
      return;
    }

    setRuntimeStatus((prev) => ({ ...prev, [serverId]: "connecting" }));
    window.setTimeout(() => {
      setRuntimeStatus((prev) => ({ ...prev, [serverId]: "connected" }));
    }, 1200);
  };

  const retryServer = (serverId: string) => {
    setRuntimeStatus((prev) => ({ ...prev, [serverId]: "connecting" }));
    window.setTimeout(() => {
      setRuntimeStatus((prev) => ({ ...prev, [serverId]: "connected" }));
    }, 1200);
  };

  const refreshAll = () => {
    setRuntimeStatus((prev) => {
      const next = { ...prev };
      for (const server of servers) {
        if (server.status === "disconnected") {
          next[server.id] = "connecting";
        }
      }
      return next;
    });
    window.setTimeout(() => {
      setRuntimeStatus((prev) => {
        const next = { ...prev };
        for (const [id, status] of Object.entries(prev)) {
          if (status === "connecting") next[id] = "connected";
        }
        return next;
      });
    }, 1200);
  };

  return (
    <div className="ext-page">
      {!embedded && (
        <div className="ext-page-lead">
          <h2 className="ext-page-title">MCP servers</h2>
          <p className="ext-page-desc">Tools and data sources exposed to the agent via Model Context Protocol.</p>
        </div>
      )}

      <div className="ext-toolbar">
        <button type="button" className="skills-btn-secondary" onClick={refreshAll}>
          <RefreshCw size={12} />
          Refresh all
        </button>
        <button type="button" className="skills-btn-primary" onClick={openCreate}>
          <Plus size={12} />
          Add server
        </button>
      </div>

      <div className="ext-stats-row">
        <ExtensionStat label="Connected" value={connectedCount} tone="success" />
        <ExtensionStat label="Tools live" value={totalTools} />
        <ExtensionStat label="Errors" value={errorCount} tone={errorCount > 0 ? "error" : "default"} />
      </div>

      <div className="ext-mcp-list">
        {servers.map((server) => {
          const expanded = expandedServer === server.id;
          const liveTools = server.status === "connected" ? server.tools.length : 0;

          return (
            <article
              key={server.id}
              className={`ext-card ext-mcp-card ext-mcp-${server.status}${expanded ? " is-expanded" : ""}`}
            >
              <div className="ext-mcp-card-main">
                <div className={`ext-mcp-status-bar ext-mcp-status-${server.status}`} aria-hidden="true" />

                <div className="ext-mcp-icon">
                  <Plug size={15} strokeWidth={1.75} />
                </div>

                <div className="ext-mcp-copy">
                  <div className="ext-mcp-title-row">
                    <h3 className="ext-card-title">{server.name}</h3>
                    <span className={`ext-status-pill ext-status-${statusTone(server.status)}`}>
                      {statusLabel(server.status)}
                    </span>
                    {server.autoConnect && server.status === "connected" && (
                      <span className="ext-chip">Auto</span>
                    )}
                    {server.docsUrl && (
                      <a
                        href={server.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ext-icon-btn"
                        aria-label={`${server.name} documentation`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className="ext-card-desc">{server.description}</p>
                  <code className="ext-command-chip">{server.command}</code>
                </div>

                <div className="ext-mcp-actions">
                  <button type="button" className="ext-text-btn" onClick={() => openEdit(server)}>
                    Edit
                  </button>
                  {server.status === "error" && (
                    <button type="button" className="ext-icon-btn" onClick={() => retryServer(server.id)} title="Retry">
                      <RefreshCw size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={server.status === "connected" ? "ext-icon-btn" : "skills-btn-primary"}
                    style={server.status === "connected" ? undefined : { height: 30, padding: "0 12px", fontSize: 11 }}
                    onClick={() => toggleConnection(server.id)}
                    disabled={server.status === "connecting"}
                  >
                    {server.status === "connected" ? (
                      <PowerOff size={13} />
                    ) : (
                      <>
                        <Power size={12} />
                        Connect
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="ext-expand-trigger"
                onClick={() => setExpandedServer(expanded ? null : server.id)}
                aria-expanded={expanded}
              >
                {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <Wrench size={12} />
                {liveTools > 0 ? `${liveTools} tools available` : `${server.tools.length} tools`}
              </button>

              {expanded && (
                <div className="ext-mcp-tools">
                  {server.tools.length > 0 ? (
                    server.tools.map((tool) => (
                      <div key={tool.name} className="ext-tool-chip">
                        <span className="ext-tool-name">{tool.name}</span>
                        {tool.description && (
                          <span className="ext-tool-desc">{tool.description}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="ext-detail-text">No tools configured. Edit this server to add tools.</p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="ext-callout">
        <Plug size={14} />
        <p>
          MCP server configs are saved locally. Apply to{" "}
          <code className="ext-inline-code">~/.pi/agent/config.json</code> and restart the agent.
        </p>
      </div>

      <ExtensionEditorModal
        open={editorOpen}
        title={editingId ? "Edit MCP server" : "Add MCP server"}
        subtitle={editingId ? "Update server connection and tools" : "Connect a new MCP server to Pi"}
        fields={MCP_FIELDS}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSave={handleSave}
        onCancel={closeEditor}
        onDelete={editingId ? handleDelete : undefined}
      />
    </div>
  );
}
