export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  enabled: boolean;
  capabilities: string[];
  triggers: string[];
  systemPrompt: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
}

export interface McpTool {
  name: string;
  description?: string;
}

export interface McpServerConfig {
  id: string;
  name: string;
  description: string;
  command: string;
  tools: McpTool[];
  docsUrl?: string;
  autoConnect?: boolean;
}

export const PROMPT_CATEGORIES = [
  "Review",
  "Debug",
  "Planning",
  "Testing",
  "Exploration",
  "Docs",
  "Custom",
] as const;

export const DEFAULT_AGENTS: AgentProfile[] = [
  {
    id: "coder",
    name: "Coder",
    role: "Implementation",
    description: "Writes production code, edits files, and runs commands with minimal scope.",
    model: "claude-sonnet-4",
    enabled: true,
    capabilities: ["Edit files", "Run shell", "Apply diffs"],
    triggers: ["implement", "fix", "add feature"],
    systemPrompt:
      "You are a focused coding agent. Prefer small diffs, match project conventions, and validate changes before finishing.",
  },
  {
    id: "explorer",
    name: "Explorer",
    role: "Research",
    description: "Maps architecture, traces data flow, and surfaces the right files before changes.",
    model: "claude-sonnet-4",
    enabled: true,
    capabilities: ["Code search", "Architecture map", "Dependency trace"],
    triggers: ["explore", "how does", "where is"],
    systemPrompt:
      "You are an exploration agent. Read widely, cite paths, and summarize structure before proposing edits.",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    role: "Quality",
    description: "Reviews diffs for correctness, regressions, and maintainability before merge.",
    model: "claude-sonnet-4",
    enabled: false,
    capabilities: ["Diff review", "Risk callouts", "Test gaps"],
    triggers: ["review", "audit", "sanity check"],
    systemPrompt:
      "You are a reviewer. Lead with risks and blocking issues, then suggestions. Be concise and specific.",
  },
  {
    id: "debugger",
    name: "Debugger",
    role: "Diagnostics",
    description: "Reproduces failures, traces the fail path, and proposes the smallest viable fix.",
    model: "claude-sonnet-4",
    enabled: true,
    capabilities: ["Repro steps", "Log analysis", "Root cause"],
    triggers: ["debug", "broken", "error", "failing"],
    systemPrompt:
      "You are a debugging agent. Reproduce first, trace the fail path, falsify hypotheses, then fix with validation.",
  },
  {
    id: "planner",
    name: "Planner",
    role: "Strategy",
    description: "Breaks large tasks into sequenced steps with clear acceptance criteria.",
    model: "claude-sonnet-4",
    enabled: true,
    capabilities: ["Task breakdown", "Tradeoffs", "Milestones"],
    triggers: ["plan", "roadmap", "break down"],
    systemPrompt:
      "You are a planning agent. Produce ordered steps, dependencies, and explicit done criteria. Avoid implementation until asked.",
  },
];

export const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: "code-review",
    title: "Code review",
    description: "Structured review focused on correctness and maintainability.",
    category: "Review",
    prompt:
      "Review this change for bugs, edge cases, and maintainability. Call out risks first, then suggestions.",
  },
  {
    id: "security-review",
    title: "Security review",
    description: "Look for auth, injection, secrets, and unsafe defaults.",
    category: "Review",
    prompt:
      "Review this code for security issues: auth boundaries, input validation, secrets handling, and unsafe defaults. Prioritize exploitable risks.",
  },
  {
    id: "debug-session",
    title: "Debug session",
    description: "Reproduce, trace, and fix with minimal scope.",
    category: "Debug",
    prompt:
      "Reproduce the issue, trace the failing path, propose the smallest fix, and list validation steps.",
  },
  {
    id: "root-cause",
    title: "Root cause analysis",
    description: "Document mechanism, fix, and prevention.",
    category: "Debug",
    prompt:
      "Explain the root cause, the failure mechanism, the minimal fix, and how to prevent recurrence. Include validation steps.",
  },
  {
    id: "refactor-plan",
    title: "Refactor plan",
    description: "Plan a safe refactor before touching code.",
    category: "Planning",
    prompt:
      "Propose a minimal refactor plan: goals, affected files, migration steps, and rollback strategy.",
  },
  {
    id: "feature-spec",
    title: "Feature spec",
    description: "Turn a vague idea into scoped requirements.",
    category: "Planning",
    prompt:
      "Draft a concise feature spec: user goal, acceptance criteria, non-goals, API/UI touchpoints, and open questions.",
  },
  {
    id: "test-plan",
    title: "Test plan",
    description: "Generate targeted tests for the current change.",
    category: "Testing",
    prompt:
      "Draft a focused test plan covering happy path, edge cases, and one regression test worth adding.",
  },
  {
    id: "explore-codebase",
    title: "Explore codebase",
    description: "Map architecture and key flows in an unfamiliar repo.",
    category: "Exploration",
    prompt:
      "Explore this codebase and summarize architecture, entry points, data flow, and where to change X.",
  },
  {
    id: "api-docs",
    title: "Document API",
    description: "Generate clear endpoint docs from implementation.",
    category: "Docs",
    prompt:
      "Document this API: purpose, request/response shapes, error cases, and one example call per endpoint.",
  },
];

export const DEFAULT_MCP_SERVERS: McpServerConfig[] = [
  {
    id: "slack-mcp",
    name: "slack-mcp",
    description: "Slack messaging, search, and workspace management",
    command: "slack-mcp-server",
    autoConnect: true,
    tools: [
      { name: "send_message", description: "Send a message to a channel" },
      { name: "search", description: "Search messages and files" },
      { name: "list_channels", description: "List workspace channels" },
      { name: "get_thread", description: "Get thread replies" },
    ],
  },
  {
    id: "filesystem",
    name: "filesystem",
    description: "File system access with read, write, and search capabilities",
    command: "mcp-filesystem",
    tools: [
      { name: "read_file", description: "Read file contents" },
      { name: "write_file", description: "Write file contents" },
      { name: "list_dir", description: "List directory contents" },
    ],
  },
  {
    id: "github",
    name: "github",
    description: "GitHub API integration for issues, PRs, and repository management",
    command: "mcp-github",
    autoConnect: true,
    docsUrl: "https://github.com/github/mcp-github",
    tools: [
      { name: "create_issue", description: "Create a GitHub issue" },
      { name: "list_prs", description: "List pull requests" },
      { name: "search_code", description: "Search code across repos" },
      { name: "merge_pr", description: "Merge a pull request" },
      { name: "get_file", description: "Get file contents from repo" },
    ],
  },
  {
    id: "postgres",
    name: "postgres",
    description: "PostgreSQL database queries and schema inspection",
    command: "mcp-postgres",
    tools: [
      { name: "query", description: "Execute SQL query" },
      { name: "list_tables", description: "List database tables" },
      { name: "describe_table", description: "Describe table schema" },
    ],
  },
];

export const newExtensionId = (): string =>
  `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const parseTags = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export const formatTags = (values: string[]): string => values.join(", ");

/** One tool per line: `name` or `name | description` */
export const parseMcpTools = (value: string): McpTool[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split("|");
      const trimmedName = name.trim();
      const description = rest.join("|").trim();
      return description
        ? { name: trimmedName, description }
        : { name: trimmedName };
    });

export const formatMcpTools = (tools: McpTool[]): string =>
  tools
    .map((tool) =>
      tool.description ? `${tool.name} | ${tool.description}` : tool.name,
    )
    .join("\n");
