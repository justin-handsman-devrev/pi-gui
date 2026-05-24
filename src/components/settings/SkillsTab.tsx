import { useState } from "react";
import { Puzzle, ExternalLink } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
  description: string;
  source: string;
  icon: string;
  enabled: boolean;
  docsUrl?: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_SKILLS: Skill[] = [
  {
    id: "lumen-diagram",
    name: "lumen-diagram",
    description: "Visual diagram generation for architecture, flows, and systems",
    source: "@the-forge-flow/lumen",
    icon: "🎨",
    enabled: true,
    docsUrl: "https://github.com/the-forge-flow/lumen",
  },
  {
    id: "lumen-chart",
    name: "lumen-chart",
    description: "Chart generation and rendering with multiple chart types",
    source: "@the-forge-flow/lumen",
    icon: "📊",
    enabled: true,
    docsUrl: "https://github.com/the-forge-flow/lumen",
  },
  {
    id: "lumen-slides",
    name: "lumen-slides",
    description: "Magazine-quality scroll-snap presentation deck generation",
    source: "@the-forge-flow/lumen",
    icon: "📽️",
    enabled: true,
    docsUrl: "https://github.com/the-forge-flow/lumen",
  },
  {
    id: "codegraph",
    name: "codegraph",
    description: "Code graph analysis and navigation with semantic code intelligence",
    source: "~/.pi/agent/skills/",
    icon: "🔍",
    enabled: true,
  },
  {
    id: "debug-mantra",
    name: "debug-mantra",
    description: "Four-mantra debugging discipline for systematic issue resolution",
    source: "~/.pi/agent/skills/",
    icon: "🐛",
    enabled: true,
  },
  {
    id: "post-mortem",
    name: "post-mortem",
    description: "Engineering post-mortem and root cause analysis documentation",
    source: "~/.pi/agent/skills/",
    icon: "📝",
    enabled: false,
  },
  {
    id: "scrutinize",
    name: "scrutinize",
    description: "Outsider-perspective end-to-end code review and sanity checks",
    source: "~/.pi/agent/skills/",
    icon: "🔎",
    enabled: true,
  },
  {
    id: "snowflake",
    name: "snowflake",
    description: "Execute SQL queries and manage Snowflake databases",
    source: "~/.agents/skills/",
    icon: "❄️",
    enabled: false,
  },
  {
    id: "connector-planner",
    name: "connector-planner",
    description: "Plan AirSync integrations and analyze external system APIs",
    source: "~/.agents/skills/",
    icon: "🔗",
    enabled: true,
  },
  {
    id: "librarian",
    name: "librarian",
    description: "Research open-source libraries with evidence-backed answers and citations",
    source: "pi-web-access",
    icon: "📚",
    enabled: true,
  },
];

// ── Toggle Switch ────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full
        transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-violet-500
        ${checked ? "bg-violet-500" : "bg-zinc-700"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
          transition-transform duration-150
          ${checked ? "translate-x-[18px]" : "translate-x-0"}
        `}
        style={{ marginTop: 2, marginLeft: 2 }}
      />
    </button>
  );
}

// ── Skills Tab ───────────────────────────────────────────────────────────────

export default function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);

  const toggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const enabledCount = skills.filter((s) => s.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-50">
          <Puzzle size={16} />
          Skills &amp; Extensions
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Manage agent skills and extensions. Skills add specialized capabilities
          to the Pi agent.{" "}
          <span className="text-zinc-400">
            {enabledCount} of {skills.length} enabled
          </span>
        </p>
      </div>

      {/* Skill Cards */}
      <div className="space-y-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`
              flex items-start gap-3 rounded-lg border p-3 transition-colors duration-150
              ${
                skill.enabled
                  ? "border-zinc-700/50 bg-zinc-800/50"
                  : "border-zinc-800/50 bg-zinc-900/50 opacity-60"
              }
            `}
          >
            {/* Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-lg">
              {skill.icon}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {skill.name}
                </p>
                {skill.docsUrl && (
                  <a
                    href={skill.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-zinc-600 transition-colors hover:text-zinc-400"
                    aria-label={`${skill.name} documentation`}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{skill.description}</p>
              <p className="mt-1 font-mono text-[10px] text-zinc-600">
                {skill.source}
              </p>
            </div>

            {/* Toggle */}
            <Toggle
              checked={skill.enabled}
              onChange={() => toggleSkill(skill.id)}
              label={`Toggle ${skill.name}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
