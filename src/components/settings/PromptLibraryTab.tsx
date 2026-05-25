import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, MessageSquare, Plus, Search } from "lucide-react";
import {
  confirmExtensionDelete,
  ExtensionEditorModal,
  type EditorField,
} from "@/components/extensions/ExtensionEditorModal";
import { ExtensionStat, prefillChatPrompt } from "@/components/extensions/extension-ui";
import {
  newExtensionId,
  PROMPT_CATEGORIES,
  type PromptTemplate,
} from "@/lib/extensions-defaults";
import { useExtensionsStore } from "@/stores/extensionsStore";
import { useUIStore } from "@/stores/uiStore";

const PROMPT_FIELDS: EditorField[] = [
  { key: "title", label: "Title", type: "text", required: true, placeholder: "Code review" },
  { key: "description", label: "Description", type: "textarea", rows: 2, required: true },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: [...PROMPT_CATEGORIES],
  },
  {
    key: "prompt",
    label: "Prompt",
    type: "textarea",
    rows: 8,
    required: true,
    placeholder: "Instructions sent to the agent…",
  },
];

const emptyPromptForm = (): Record<string, string | boolean> => ({
  title: "",
  description: "",
  category: "Custom",
  prompt: "",
});

const promptToForm = (prompt: PromptTemplate): Record<string, string | boolean> => ({
  title: prompt.title,
  description: prompt.description,
  category: prompt.category,
  prompt: prompt.prompt,
});

interface PromptLibraryTabProps {
  embedded?: boolean;
}

export default function PromptLibraryTab({ embedded = false }: PromptLibraryTabProps) {
  const setSidebarView = useUIStore((s) => s.setSidebarView);
  const prompts = useExtensionsStore((s) => s.prompts);
  const load = useExtensionsStore((s) => s.load);
  const addPrompt = useExtensionsStore((s) => s.addPrompt);
  const updatePrompt = useExtensionsStore((s) => s.updatePrompt);
  const deletePrompt = useExtensionsStore((s) => s.deletePrompt);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(emptyPromptForm());

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => ["All", ...new Set(prompts.map((prompt) => prompt.category))],
    [prompts],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return prompts.filter((prompt) => {
      if (category !== "All" && prompt.category !== category) return false;
      if (!needle) return true;
      return (
        prompt.title.toLowerCase().includes(needle)
        || prompt.description.toLowerCase().includes(needle)
        || prompt.prompt.toLowerCase().includes(needle)
      );
    });
  }, [category, prompts, query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPromptForm());
    setEditorOpen(true);
  };

  const openEdit = (prompt: PromptTemplate) => {
    setEditingId(prompt.id);
    setForm(promptToForm(prompt));
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const title = String(form.title).trim();
    const description = String(form.description).trim();
    const promptText = String(form.prompt).trim();
    if (!title || !description || !promptText) return;

    const payload: PromptTemplate = {
      id: editingId ?? newExtensionId(),
      title,
      description,
      category: String(form.category).trim() || "Custom",
      prompt: promptText,
    };

    if (editingId) {
      updatePrompt(payload);
    } else {
      addPrompt(payload);
    }
    closeEditor();
  };

  const handleDelete = () => {
    if (!editingId) return;
    const prompt = prompts.find((entry) => entry.id === editingId);
    if (!prompt || !confirmExtensionDelete(prompt.title)) return;
    deletePrompt(editingId);
    closeEditor();
  };

  const copyPrompt = async (prompt: PromptTemplate) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedId(prompt.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard may be unavailable
    }
  };

  const useInChat = (prompt: PromptTemplate) => {
    setSidebarView("chats");
    prefillChatPrompt(prompt.prompt);
  };

  return (
    <div className="ext-page">
      {!embedded && (
        <div className="ext-page-lead">
          <h2 className="ext-page-title">Prompt library</h2>
          <p className="ext-page-desc">Reusable prompts for common coding workflows.</p>
        </div>
      )}

      <div className="ext-toolbar">
        <div className="ext-search-wrap">
          <Search size={13} className="ext-search-icon" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts…"
            className="ext-search-input"
          />
        </div>
        <button type="button" className="skills-btn-primary" onClick={openCreate}>
          <Plus size={12} />
          Add prompt
        </button>
      </div>

      <div className="ext-stats-row">
        <ExtensionStat label="Templates" value={prompts.length} />
        <ExtensionStat label="Showing" value={filtered.length} />
        <ExtensionStat label="Categories" value={categories.length - 1} />
      </div>

      <div className="ext-filter-row">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={`ext-filter-pill${category === item ? " is-active" : ""}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="ext-prompt-list">
        {filtered.map((prompt) => {
          const expanded = expandedId === prompt.id;
          const copied = copiedId === prompt.id;
          return (
            <article key={prompt.id} className={`ext-card ext-prompt-card${expanded ? " is-expanded" : ""}`}>
              <div className="ext-prompt-header">
                <button
                  type="button"
                  className="ext-prompt-main"
                  onClick={() => setExpandedId(expanded ? null : prompt.id)}
                  aria-expanded={expanded}
                >
                  <span className="ext-expand-icon">
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <span className="ext-prompt-copy">
                    <span className="ext-prompt-title-row">
                      <span className="ext-card-title">{prompt.title}</span>
                      <span className="ext-chip">{prompt.category}</span>
                    </span>
                    <span className="ext-card-desc">{prompt.description}</span>
                  </span>
                </button>
                <div className="ext-prompt-actions">
                  <button type="button" className="ext-text-btn" onClick={() => openEdit(prompt)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ext-icon-btn"
                    title={copied ? "Copied" : "Copy prompt"}
                    onClick={() => void copyPrompt(prompt)}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    type="button"
                    className="btn-warm ext-use-btn"
                    onClick={() => useInChat(prompt)}
                  >
                    <MessageSquare size={12} />
                    Use in chat
                  </button>
                </div>
              </div>
              {expanded && (
                <pre className="ext-prompt-body">{prompt.prompt}</pre>
              )}
            </article>
          );
        })}
      </div>

      <ExtensionEditorModal
        open={editorOpen}
        title={editingId ? "Edit prompt" : "Add prompt"}
        fields={PROMPT_FIELDS}
        values={form}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        onSave={handleSave}
        onCancel={closeEditor}
        onDelete={editingId ? handleDelete : undefined}
      />
    </div>
  );
}
