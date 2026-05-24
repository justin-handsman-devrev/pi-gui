import { useState } from "react";
import { Plug, Wifi, WifiOff, ExternalLink } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type McpStatus = "connected" | "disconnected" | "error";

interface McpTool {
  name: string;
}

interface McpServer {
  id: string;
  name: string;
  description: string;
  command: string;
  status: McpStatus;
  tools: McpTool[];
  docsUrl?: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_SERVERS: McpServer[] = [
  {
    id: "slack-mcp",
    name: "slack-mcp",
    description: "Slack messaging, search, and workspace management",
    command: "slack-mcp-server",
    status: "connected",
    tools: [
      { name: "send_message" },
      { name: "search" },
      { name: "list_channels" },
      { name: "get_thread" },
    ],
  },
  {
    id: "filesystem",
    name: "filesystem",
    description: "File system access with read, write, and search capabilities",
    command: "mcp-filesystem",
    status: "disconnected",
    tools: [
      { name: "read_file" },
      { name: "write_file" },
      { name: "list_dir" },
    ],
  },
  {
    id: "github",
    name: "github",
    description: "GitHub API integration for issues, PRs, and repository management",
    command: "mcp-github",
    status: "connected",
    tools: [
      { name: "create_issue" },
      { name: "list_prs" },
      { name: "search_code" },
      { name: "merge_pr" },
      { name: "get_file" },
    ],
    docsUrl: "https://github.com/github/mcp-github",
  },
  {
    id: "postgres",
    name: "postgres",
    description: "PostgreSQL database queries and schema inspection",
    command: "mcp-postgres",
    status: "error",
    tools: [
      { name: "query" },
      { name: "list_tables" },
      { name: "describe_table" },
    ],
  },
];

// ── Status indicator ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: McpStatus }) {
  const colors: Record<McpStatus, string> = {
    connected: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
    disconnected: "bg-zinc-600",
    error: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]",
  };

  const labels: Record<McpStatus, string> = {
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Error",
  };

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${colors[status]}`}
        aria-hidden="true"
      />
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          status === "connected"
            ? "text-emerald-400"
            : status === "error"
              ? "text-red-400"
              : "text-zinc-500"
        }`}
      >
        {labels[status]}
      </span>
    </span>
  );
}

// ── MCP Tab ──────────────────────────────────────────────────────────────────

export default function McpTab() {
  const [servers] = useState<McpServer[]>(INITIAL_SERVERS);

  const connectedCount = servers.filter((s) => s.status === "connected").length;
  const totalTools = servers.reduce(
    (sum, s) => sum + (s.status === "connected" ? s.tools.length : 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-50">
          <Plug size={16} />
          MCP Servers
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Model Context Protocol servers provide tools and data sources to the agent.{" "}
          <span className="text-zinc-400">
            {connectedCount} connected · {totalTools} tools available
          </span>
        </p>
      </div>

      {/* Server Cards */}
      <div className="space-y-2">
        {servers.map((server) => (
          <div
            key={server.id}
            className={`
              rounded-lg border p-4 transition-colors duration-150
              ${
                server.status === "error"
                  ? "border-red-500/20 bg-red-500/5"
                  : server.status === "connected"
                    ? "border-zinc-700/50 bg-zinc-800/50"
                    : "border-zinc-800/50 bg-zinc-900/50 opacity-60"
              }
            `}
          >
            {/* Top row: name + status */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    server.status === "connected"
                      ? "bg-zinc-800 text-zinc-400"
                      : server.status === "error"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-zinc-800/50 text-zinc-600"
                  }`}
                >
                  {server.status === "connected" ? (
                    <Wifi size={16} />
                  ) : (
                    <WifiOff size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {server.name}
                    </p>
                    {server.docsUrl && (
                      <a
                        href={server.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-zinc-600 transition-colors hover:text-zinc-400"
                        aria-label={`${server.name} documentation`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {server.description}
                  </p>
                </div>
              </div>
              <StatusDot status={server.status} />
            </div>

            {/* Command */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Command
              </span>
              <code className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                {server.command}
              </code>
            </div>

            {/* Tools badges */}
            {server.tools.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Tools
                </span>
                <div className="flex flex-wrap gap-1">
                  {server.tools.map((tool) => (
                    <span
                      key={tool.name}
                      className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                        server.status === "connected"
                          ? "bg-zinc-800 text-zinc-400"
                          : "bg-zinc-900 text-zinc-600"
                      }`}
                    >
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer info */}
      <p className="text-[11px] text-zinc-600">
        MCP servers are configured in{" "}
        <code className="text-zinc-500">~/.pi/agent/config.json</code>. Restart
        the agent to apply changes.
      </p>
    </div>
  );
}
