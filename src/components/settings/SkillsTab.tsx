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
        transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#9d8bb8]
        ${checked ? "bg-[#5fb8a3]" : "bg-[#44403c]"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 rounded-full bg-[#fafaf9] shadow-sm
          transition-transform duration-150
          ${checked ? "translate-x-[18px]" : "translate-x-0"}
        `}
        style={{ marginTop: 2, marginLeft: 2 }}
      />
    </button>
  );
}

// ── Skills Tab ───────────────────────────────────────────────────────────────

/**
 * Skills tab with ElevenLabs-inspired warm dark design:
 * - Aurora-mint (#5fb8a3) for enabled toggle switches
 * - Warm ink backgrounds for cards
 * - Hover states on ink-700
 */
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
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#fafaf9]">
          <Puzzle size={16} className="text-[#9d8bb8]" />
          Skills &amp; Extensions
        </h3>
        <p className="mt-1 text-xs text-[#57534e]">
          Manage agent skills and extensions. Skills add specialized capabilities
          to the Pi agent.{" "}
          <span className="text-[#78716c]">
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
                  ? "border-[#44403c]/50 bg-[#1c1917]/80"
                  : "border-[#44403c]/20 bg-[#1c1917]/30 opacity-60"
              }
            `}
          >
            {/* Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#292524] text-lg">
              {skill.icon}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-[#fafaf9]">
                  {skill.name}
                </p>
                {skill.docsUrl && (
                  <a
                    href={skill.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[#57534e] transition-colors duration-150 hover:text-[#78716c]"
                    aria-label={`${skill.name} documentation`}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#78716c]">{skill.description}</p>
              <p className="mt-1 font-mono text-[10px] text-[#57534e]">
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
