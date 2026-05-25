import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { ExtensionStat, ExtensionToggle } from "@/components/extensions/extension-ui";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import {
  listInstalledSkills,
  readSkillContent,
  setSkillEnabled,
  writeSkillContent,
  skillsCliAdd,
  skillsCliFind,
  skillsCliInit,
  skillsCliListRemote,
  skillsCliRemove,
  skillsCliUpdate,
  type SkillRecord,
} from "@/lib/tauri-commands";

type AgentFilter = "all" | "pi" | "cursor" | "agents" | "codex";

function agentMatches(skill: SkillRecord, filter: AgentFilter): boolean {
  if (filter === "all") return true;
  return skill.sources.some((source) => source.agent === filter);
}

function formatSourceLabels(skill: SkillRecord): string {
  return skill.sources.map((source) => source.label).join(" · ");
}

export default function SkillsTab({ embedded = false }: { embedded?: boolean }) {
  const projectCwd = getActiveProjectCwd();
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [enabledCount, setEnabledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [editingContent, setEditingContent] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [savingSkill, setSavingSkill] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [installSource, setInstallSource] = useState("");
  const [installGlobal, setInstallGlobal] = useState(true);
  const [installAgent, setInstallAgent] = useState("pi");
  const [remoteListing, setRemoteListing] = useState("");
  const [cliOutput, setCliOutput] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listInstalledSkills(projectCwd || undefined, false);
      setSkills(result.skills);
      setEnabledCount(result.enabled);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [projectCwd]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return skills.filter((skill) => {
      if (!agentMatches(skill, agentFilter)) return false;
      if (!needle) return true;
      return (
        skill.name.toLowerCase().includes(needle)
        || skill.description.toLowerCase().includes(needle)
        || skill.sources.some((source) => source.label.toLowerCase().includes(needle))
      );
    });
  }, [agentFilter, query, skills]);

  const toggleSkill = async (skill: SkillRecord) => {
    setBusy(true);
    setError(null);
    try {
      await setSkillEnabled(skill.skillDir, !skill.enabled);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const expandSkill = async (skill: SkillRecord) => {
    if (expandedId === skill.skillDir) {
      setExpandedId(null);
      setPreview("");
      setEditingContent(false);
      setEditDraft("");
      return;
    }
    setExpandedId(skill.skillDir);
    setEditingContent(false);
    setEditDraft("");
    try {
      const content = await readSkillContent(skill.skillMdPath);
      setPreview(content);
    } catch (err: unknown) {
      setPreview(err instanceof Error ? err.message : String(err));
    }
  };

  const cancelEditSkill = () => {
    setEditingContent(false);
    setEditDraft("");
  };

  const saveSkillContent = async (skill: SkillRecord) => {
    setSavingSkill(true);
    setError(null);
    try {
      await writeSkillContent(skill.skillMdPath, editDraft);
      setPreview(editDraft);
      setEditingContent(false);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSkill(false);
    }
  };

  const runInstall = async () => {
    if (!installSource.trim()) return;
    setBusy(true);
    setError(null);
    setCliOutput("");
    try {
      const result = await skillsCliAdd({
        source: installSource.trim(),
        projectCwd: projectCwd || undefined,
        global: installGlobal,
        agent: installAgent,
      });
      setCliOutput([result.stdout, result.stderr].filter(Boolean).join("\n"));
      if (!result.success) {
        setError(result.stderr || "Install failed");
        return;
      }
      setShowInstall(false);
      setInstallSource("");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const listRemoteSkills = async () => {
    if (!installSource.trim()) return;
    setBusy(true);
    setRemoteListing("");
    try {
      const result = await skillsCliListRemote(installSource.trim());
      setRemoteListing([result.stdout, result.stderr].filter(Boolean).join("\n"));
    } catch (err: unknown) {
      setRemoteListing(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const runFind = async () => {
    setBusy(true);
    setCliOutput("");
    try {
      const result = await skillsCliFind(query.trim() || undefined);
      setCliOutput([result.stdout, result.stderr].filter(Boolean).join("\n"));
    } catch (err: unknown) {
      setCliOutput(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const runUpdateAll = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await skillsCliUpdate({
        projectCwd: projectCwd || undefined,
        global: true,
      });
      if (!result.success) {
        setError(result.stderr || "Update failed");
      }
      setCliOutput([result.stdout, result.stderr].filter(Boolean).join("\n"));
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const runInit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await skillsCliInit({ projectCwd: projectCwd || undefined });
      if (!result.success) {
        setError(result.stderr || "Init failed");
      }
      setCliOutput([result.stdout, result.stderr].filter(Boolean).join("\n"));
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const removeSkill = async (skill: SkillRecord) => {
    setBusy(true);
    setError(null);
    try {
      const isGlobal = skill.sources.some((source) => source.scope === "global");
      const agent = skill.sources[0]?.agent;
      const result = await skillsCliRemove({
        skillNames: [skill.name],
        projectCwd: projectCwd || undefined,
        global: isGlobal,
        agent,
      });
      if (!result.success) {
        setError(result.stderr || "Remove failed");
      }
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const filters: { id: AgentFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pi", label: "Pi" },
    { id: "cursor", label: "Cursor" },
    { id: "agents", label: "Shared" },
    { id: "codex", label: "Codex" },
  ];

  return (
    <div className="ext-page skills-tab">
      {!embedded && (
        <div className="ext-page-lead">
          <h2 className="ext-page-title">Skills</h2>
          <p className="ext-page-desc">Local skills and skills.sh installs for Pi, Cursor, and shared agents.</p>
        </div>
      )}

      <div className="ext-toolbar skills-toolbar">
        <div className="skills-search-wrap">
          <Search size={13} className="skills-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search installed skills…"
            className="skills-search-input"
          />
        </div>
        <div className="skills-toolbar-actions">
          <button type="button" className="skills-btn-secondary" onClick={() => void runFind()} disabled={busy}>
            Find
          </button>
          <button type="button" className="skills-btn-secondary" onClick={() => void runUpdateAll()} disabled={busy}>
            Update
          </button>
          <button type="button" className="btn-warm" onClick={() => void runInit()} disabled={busy} style={{ height: 32, fontSize: 11, padding: "0 14px" }}>
            New
          </button>
          <button type="button" className="skills-btn-primary" onClick={() => setShowInstall(true)} disabled={busy}>
            <Plus size={12} />
            Install
          </button>
          <button type="button" className="skills-icon-btn" onClick={() => void refresh()} disabled={busy || loading} title="Refresh">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="ext-stats-row">
        <ExtensionStat label="Enabled" value={enabledCount} tone="success" />
        <ExtensionStat label="Installed" value={skills.length} />
        <ExtensionStat label="Showing" value={filtered.length} />
      </div>

      <div className="ext-filter-row skills-filters">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`ext-filter-pill${agentFilter === filter.id ? " is-active" : ""}`}
            onClick={() => setAgentFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="skills-meta-row">
        <a href="https://skills.sh" target="_blank" rel="noopener noreferrer" className="skills-link">
          Browse skills.sh
          <ExternalLink size={11} />
        </a>
      </div>

      {error && <div className="skills-error">{error}</div>}

      {showInstall && (
        <div className="skills-install-panel">
          <div className="skills-install-header">
            <strong>Install from skills.sh</strong>
            <button type="button" className="skills-icon-btn" onClick={() => setShowInstall(false)}>×</button>
          </div>
          <p className="skills-install-desc">
            Enter a GitHub repo (<code>owner/repo</code>) or full URL. Uses <code>npx skills add</code> under the hood.
          </p>
          <input
            type="text"
            value={installSource}
            onChange={(event) => setInstallSource(event.target.value)}
            placeholder="vercel-labs/agent-skills"
            className="skills-install-input"
          />
          <div className="skills-install-options">
            <label className="skills-check">
              <input type="checkbox" checked={installGlobal} onChange={(event) => setInstallGlobal(event.target.checked)} />
              Global install
            </label>
            <label className="skills-install-agent">
              Agent
              <select value={installAgent} onChange={(event) => setInstallAgent(event.target.value)}>
                <option value="pi">pi</option>
                <option value="cursor">cursor</option>
                <option value="codex">codex</option>
                <option value="claude-code">claude-code</option>
              </select>
            </label>
          </div>
          <div className="skills-install-actions">
            <button type="button" className="skills-btn-secondary" onClick={() => void listRemoteSkills()} disabled={busy || !installSource.trim()}>
              List available
            </button>
            <button type="button" className="skills-btn-primary" onClick={() => void runInstall()} disabled={busy || !installSource.trim()}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : "Install"}
            </button>
          </div>
          {remoteListing && <pre className="skills-cli-output">{remoteListing}</pre>}
        </div>
      )}

      {cliOutput && !showInstall && <pre className="skills-cli-output">{cliOutput}</pre>}

      {loading ? (
        <div className="skills-loading">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="skills-empty">
          <p>No skills found{query ? " for this search" : ""}.</p>
          <p className="skills-empty-desc">Install from skills.sh or add SKILL.md folders to ~/.pi/agent/skills.</p>
        </div>
      ) : (
        <div className="skills-list">
          {filtered.map((skill) => {
            const expanded = expandedId === skill.skillDir;
            return (
              <div
                key={skill.skillDir}
                className={`skills-card${skill.enabled ? "" : " is-disabled"}${expanded ? " is-expanded" : ""}`}
              >
                <div className="skills-card-main">
                  <button type="button" className="skills-expand-btn" onClick={() => void expandSkill(skill)} aria-expanded={expanded}>
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <div className="skills-card-body">
                    <div className="skills-card-title-row">
                      <p className="skills-card-name">{skill.name}</p>
                      {skill.internal && <span className="skills-badge">internal</span>}
                      {skill.symlinkTarget && <span className="skills-badge">symlink</span>}
                    </div>
                    <p className="skills-card-desc">{skill.description}</p>
                    <p className="skills-card-source">{formatSourceLabels(skill)}</p>
                  </div>
                  <div className="skills-card-actions">
                    <button
                      type="button"
                      className="skills-icon-btn"
                      title="Edit SKILL.md"
                      onClick={() => void (async () => {
                        if (expandedId !== skill.skillDir) {
                          setExpandedId(skill.skillDir);
                          setEditingContent(false);
                          try {
                            const content = await readSkillContent(skill.skillMdPath);
                            setPreview(content);
                            setEditDraft(content);
                            setEditingContent(true);
                          } catch (err: unknown) {
                            setPreview(err instanceof Error ? err.message : String(err));
                          }
                          return;
                        }
                        setEditDraft(preview);
                        setEditingContent(true);
                      })()}
                      disabled={busy || savingSkill}
                    >
                      <Pencil size={12} />
                    </button>
                    <button type="button" className="skills-icon-btn" title="Remove via skills CLI" onClick={() => void removeSkill(skill)} disabled={busy}>
                      <Trash2 size={12} />
                    </button>
                    <ExtensionToggle
                      checked={skill.enabled}
                      onChange={() => void toggleSkill(skill)}
                      label={`Toggle ${skill.name}`}
                    />
                  </div>
                </div>
                {expanded && (
                  <div className="skills-preview-wrap">
                    {editingContent && expandedId === skill.skillDir ? (
                      <>
                        <textarea
                          className="skills-preview-editor"
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                          spellCheck={false}
                        />
                        <div className="skills-preview-actions">
                          <button type="button" className="skills-btn-secondary" onClick={cancelEditSkill} disabled={savingSkill}>
                            Cancel
                          </button>
                          <button type="button" className="skills-btn-primary" onClick={() => void saveSkillContent(skill)} disabled={savingSkill}>
                            {savingSkill ? <Loader2 size={13} className="animate-spin" /> : "Save"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <pre className="skills-preview">{preview}</pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
