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
    // Aurora-mint for connected
    connected: "bg-[#5fb8a3] shadow-[0_0_6px_rgba(95,184,163,0.5)]",
    // Warm ink for disconnected
    disconnected: "bg-[#57534e]",
    // Aurora-rose for error
    error: "bg-[#c494a4] shadow-[0_0_6px_rgba(196,148,164,0.5)]",
  };

  const labels: Record<McpStatus, string> = {
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Error",
  };

  const textColors: Record<McpStatus, string> = {
    connected: "text-[#5fb8a3]",
    disconnected: "text-[#57534e]",
    error: "text-[#c494a4]",
  };

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${colors[status]}`}
        aria-hidden="true"
      />
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider ${textColors[status]}`}
      >
        {labels[status]}
      </span>
    </span>
  );
}

// ── MCP Tab ──────────────────────────────────────────────────────────────────

/**
 * MCP servers tab with ElevenLabs-inspired design:
 * - Aurora-mint (#5fb8a3) for connected status
 * - Aurora-rose (#c494a4) for error status
 * - Warm ink backgrounds for server cards
 */
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
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#fafaf9]">
          <Plug size={16} className="text-[#9d8bb8]" />
          MCP Servers
        </h3>
        <p className="mt-1 text-xs text-[#57534e]">
          Model Context Protocol servers provide tools and data sources to the agent.{" "}
          <span className="text-[#78716c]">
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
                  ? "border-[#c494a4]/20 bg-[#c494a4]/5"
                  : server.status === "connected"
                    ? "border-[#44403c]/50 bg-[#1c1917]/80"
                    : "border-[#44403c]/20 bg-[#1c1917]/30 opacity-60"
              }
            `}
          >
            {/* Top row: name + status */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    server.status === "connected"
                      ? "bg-[#292524] text-[#5fb8a3]"
                      : server.status === "error"
                        ? "bg-[#c494a4]/10 text-[#c494a4]"
                        : "bg-[#292524]/50 text-[#57534e]"
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
                    <p className="truncate text-sm font-medium text-[#fafaf9]">
                      {server.name}
                    </p>
                    {server.docsUrl && (
                      <a
                        href={server.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[#57534e] transition-colors duration-150 hover:text-[#78716c]"
                        aria-label={`${server.name} documentation`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#78716c]">
                    {server.description}
                  </p>
                </div>
              </div>
              <StatusDot status={server.status} />
            </div>

            {/* Command */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#57534e]">
                Command
              </span>
              <code className="rounded bg-[#0c0a09] px-2 py-0.5 font-mono text-[11px] text-[#78716c]">
                {server.command}
              </code>
            </div>

            {/* Tools badges */}
            {server.tools.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#57534e]">
                  Tools
                </span>
                <div className="flex flex-wrap gap-1">
                  {server.tools.map((tool) => (
                    <span
                      key={tool.name}
                      className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                        server.status === "connected"
                          ? "bg-[#292524] text-[#78716c]"
                          : "bg-[#1c1917] text-[#57534e]"
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
      <p className="text-[11px] text-[#44403c]">
        MCP servers are configured in{" "}
        <code className="text-[#57534e]">~/.pi/agent/config.json</code>. Restart
        the agent to apply changes.
      </p>
    </div>
  );
}
