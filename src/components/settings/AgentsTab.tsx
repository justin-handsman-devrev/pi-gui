import { useEffect, useMemo, useState } from "react";
import { Bot, ChevronDown, ChevronRight, Plus, Search, Sparkles } from "lucide-react";
import {
  confirmExtensionDelete,
  ExtensionEditorModal,
  type EditorField,
} from "@/components/extensions/ExtensionEditorModal";
import { ExtensionStat, ExtensionToggle } from "@/components/extensions/extension-ui";
import {
  formatTags,
  newExtensionId,
  parseTags,
  type AgentProfile,
} from "@/lib/extensions-defaults";
import { useExtensionsStore } from "@/stores/extensionsStore";

const AGENT_FIELDS: EditorField[] = [
  { key: "name", label: "Name", type: "text", required: true, placeholder: "Coder" },
  { key: "role", label: "Role", type: "text", required: true, placeholder: "Implementation" },
  { key: "description", label: "Description", type: "textarea", rows: 2, required: true },
  { key: "model", label: "Model", type: "text", placeholder: "claude-sonnet-4" },
  {
    key: "capabilities",
    label: "Capabilities",
    type: "tags",
    hint: "Comma-separated list",
    placeholder: "Edit files, Run shell",
  },
  {
    key: "triggers",
    label: "Triggers",
    type: "tags",
    hint: "Comma-separated keywords that route to this agent",
    placeholder: "implement, fix, add feature",
  },
  {
    key: "systemPrompt",
    label: "System prompt",
    type: "textarea",
    rows: 6,
    required: true,
  },
  { key: "enabled", label: "Enabled", type: "checkbox" },
];

const emptyAgentForm = (): Record<string, string | boolean> => ({
  name: "",
  role: "",
  description: "",
  model: "claude-sonnet-4",
  capabilities: "",
  triggers: "",
  systemPrompt: "",
  enabled: true,
});

const agentToForm = (agent: AgentProfile): Record<string, string | boolean> => ({
  name: agent.name,
  role: agent.role,
  description: agent.description,
  model: agent.model,
  capabilities: formatTags(agent.capabilities),
  triggers: formatTags(agent.triggers),
  systemPrompt: agent.systemPrompt,
  enabled: agent.enabled,
});

interface AgentsTabProps {
  embedded?: boolean;
}

export default function AgentsTab({ embedded = false }: AgentsTabProps) {
  const agents = useExtensionsStore((s) => s.agents);
  const load = useExtensionsStore((s) => s.load);
  const addAgent = useExtensionsStore((s) => s.addAgent);
  const updateAgent = useExtensionsStore((s) => s.updateAgent);
  const deleteAgent = useExtensionsStore((s) => s.deleteAgent);

  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(emptyAgentForm());

  useEffect(() => {
    load();
  }, [load]);

  const enabledCount = agents.filter((agent) => agent.enabled).length;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return agents;
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(needle)
      || agent.role.toLowerCase().includes(needle)
      || agent.description.toLowerCase().includes(needle)
      || agent.capabilities.some((cap) => cap.toLowerCase().includes(needle)),
    );
  }, [agents, query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyAgentForm());
    setEditorOpen(true);
  };

  const openEdit = (agent: AgentProfile) => {
    setEditingId(agent.id);
    setForm(agentToForm(agent));
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const name = String(form.name).trim();
    const role = String(form.role).trim();
    const description = String(form.description).trim();
    const systemPrompt = String(form.systemPrompt).trim();
    if (!name || !role || !description || !systemPrompt) return;

    const payload: AgentProfile = {
      id: editingId ?? newExtensionId(),
      name,
      role,
      description,
      model: String(form.model).trim() || "claude-sonnet-4",
      enabled: form.enabled === true,
      capabilities: parseTags(String(form.capabilities)),
      triggers: parseTags(String(form.triggers)),
      systemPrompt,
    };

    if (editingId) {
      updateAgent(payload);
    } else {
      addAgent(payload);
    }
    closeEditor();
  };

  const handleDelete = () => {
    if (!editingId) return;
    const agent = agents.find((entry) => entry.id === editingId);
    if (!agent || !confirmExtensionDelete(agent.name)) return;
    deleteAgent(editingId);
    closeEditor();
  };

  const toggleAgent = (id: string) => {
    const agent = agents.find((entry) => entry.id === id);
    if (!agent) return;
    updateAgent({ ...agent, enabled: !agent.enabled });
  };

  return (
    <div className="ext-page">
      {!embedded && (
        <div className="ext-page-lead">
          <h2 className="ext-page-title">Agents</h2>
          <p className="ext-page-desc">Subagent profiles for coding, exploration, review, and planning.</p>
        </div>
      )}

      <div className="ext-toolbar">
        <div className="ext-search-wrap">
          <Search size={13} className="ext-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search agents…"
            className="ext-search-input"
          />
        </div>
        <button type="button" className="skills-btn-primary" onClick={openCreate}>
          <Plus size={12} />
          Add agent
        </button>
      </div>

      <div className="ext-stats-row">
        <ExtensionStat label="Active" value={enabledCount} tone="success" />
        <ExtensionStat label="Profiles" value={agents.length} />
        <ExtensionStat label="Models" value={new Set(agents.map((a) => a.model)).size} />
      </div>

      <div className="ext-agent-grid">
        {filtered.map((agent) => {
          const expanded = expandedId === agent.id;
          return (
            <article
              key={agent.id}
              className={`ext-card ext-agent-card${agent.enabled ? "" : " is-muted"}${expanded ? " is-expanded" : ""}`}
            >
              <div className="ext-agent-card-top">
                <div className="ext-agent-icon">
                  <Bot size={16} strokeWidth={1.75} />
                </div>
                <div className="ext-agent-copy">
                  <div className="ext-agent-title-row">
                    <h3 className="ext-card-title">{agent.name}</h3>
                    <span className="ext-chip">{agent.role}</span>
                  </div>
                  <p className="ext-card-desc">{agent.description}</p>
                </div>
                <div className="ext-card-controls">
                  <button type="button" className="ext-text-btn" onClick={() => openEdit(agent)}>
                    Edit
                  </button>
                  <ExtensionToggle
                    checked={agent.enabled}
                    onChange={() => toggleAgent(agent.id)}
                    label={`Toggle ${agent.name}`}
                  />
                </div>
              </div>

              <div className="ext-agent-meta">
                <span className="ext-mono-chip">{agent.model}</span>
                {agent.capabilities.slice(0, 3).map((cap) => (
                  <span key={cap} className="ext-tag">{cap}</span>
                ))}
              </div>

              <button
                type="button"
                className="ext-expand-trigger"
                onClick={() => setExpandedId(expanded ? null : agent.id)}
                aria-expanded={expanded}
              >
                {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                Profile details
              </button>

              {expanded && (
                <div className="ext-agent-details">
                  <div className="ext-detail-block">
                    <p className="ext-detail-label">Triggers</p>
                    <div className="ext-tag-row">
                      {agent.triggers.length > 0 ? (
                        agent.triggers.map((trigger) => (
                          <span key={trigger} className="ext-tag ext-tag-soft">{trigger}</span>
                        ))
                      ) : (
                        <span className="ext-detail-text">No triggers configured</span>
                      )}
                    </div>
                  </div>
                  <div className="ext-detail-block">
                    <p className="ext-detail-label">System prompt</p>
                    <p className="ext-detail-text">{agent.systemPrompt}</p>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="ext-callout">
        <Sparkles size={14} />
        <p>
          Agent profiles are saved locally. Sync to{" "}
          <code className="ext-inline-code">~/.pi/agent/config.json</code> when wiring routing.
        </p>
      </div>

      <ExtensionEditorModal
        open={editorOpen}
        title={editingId ? "Edit agent" : "Add agent"}
        subtitle={editingId ? "Update subagent profile and routing" : "Create a new subagent profile"}
        fields={AGENT_FIELDS}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSave={handleSave}
        onCancel={closeEditor}
        onDelete={editingId ? handleDelete : undefined}
      />
    </div>
  );
}
