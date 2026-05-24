import { ExternalLink, GitBranch, Info } from "lucide-react";

/**
 * About tab with ElevenLabs-inspired design:
 * - Centered logo with aurora lavender glow
 * - Warm ink background cards
 * - Aurora lavender (#9d8bb8) for links
 * - Monospace version info
 */
export default function AboutTab() {
  const tauriVersion = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
    ? "2.x"
    : "—";

  const platform = typeof navigator !== "undefined"
    ? navigator.platform
    : "";

  let os = "Unknown";
  let arch = "";

  if (platform.includes("Mac") || platform.includes("Darwin")) {
    os = "macOS";
    // Check Apple Silicon
    arch = platform.includes("arm") || platform.includes("ARM")
      ? "Apple Silicon"
      : "Intel";
  } else if (platform.includes("Win")) {
    os = "Windows";
  } else if (platform.includes("Linux")) {
    os = "Linux";
  }

  return (
    <div className="flex flex-col items-center py-8">
      {/* Logo with aurora glow */}
      <div 
        className="text-7xl font-bold leading-none select-none text-[#9d8bb8]"
        style={{ textShadow: "0 0 40px rgba(157, 139, 184, 0.4)" }}
        aria-hidden="true"
      >
        π
      </div>

      {/* Title */}
      <h2 className="mt-4 text-2xl font-bold text-[#fafaf9]">Pi GUI</h2>

      {/* Version pill */}
      <span className="mt-2 rounded-full bg-[#292524] px-3 py-1 text-xs font-medium font-mono text-[#78716c]">
        v0.1.0
      </span>

      {/* Description */}
      <p className="mt-4 max-w-sm text-center text-sm text-[#78716c]">
        A desktop interface for the Pi coding agent — an AI-powered assistant
        that helps you build, debug, and ship software.
      </p>

      {/* Links */}
      <div className="mt-6 flex items-center gap-3">
        <a
          href="https://github.com/user/pi-gui"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-[#44403c]/50 bg-[#1c1917]/50 px-3 py-2 text-xs font-medium text-[#a8a29e] transition-colors duration-150 hover:border-[#44403c] hover:text-[#fafaf9]"
        >
          <GitBranch size={14} />
          GitHub
          <ExternalLink size={10} className="opacity-50" />
        </a>
        <a
          href="https://docs.pi-agent.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-[#44403c]/50 bg-[#1c1917]/50 px-3 py-2 text-xs font-medium text-[#a8a29e] transition-colors duration-150 hover:border-[#44403c] hover:text-[#fafaf9]"
        >
          <ExternalLink size={14} />
          Documentation
          <ExternalLink size={10} className="opacity-50" />
        </a>
      </div>

      {/* Separator */}
      <div className="mt-8 w-full border-t border-[#44403c]/30" />

      {/* System Info */}
      <div className="mt-6 w-full">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#57534e]">
          <Info size={12} />
          System Information
        </h3>
        <dl className="mt-3 space-y-2">
          <SystemInfoRow label="Operating System" value={os} />
          {arch && <SystemInfoRow label="Architecture" value={arch} />}
          <SystemInfoRow label="Tauri Version" value={tauriVersion} />
          <SystemInfoRow label="App Version" value="0.1.0" />
          <SystemInfoRow
            label="Renderer"
            value={`${navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] ?? "Unknown"} Chromium`}
          />
        </dl>
      </div>

      {/* Credits */}
      <div className="mt-8 w-full border-t border-[#44403c]/30 pt-6">
        <p className="text-center text-[11px] text-[#44403c]">
          Built with Tauri, React, and Tailwind CSS
        </p>
        <p className="mt-1 text-center text-[11px] text-[#44403c]">
          Pi Agent · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ── Helper Component ─────────────────────────────────────────────────────────

function SystemInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#292524]/50 px-3 py-2">
      <dt className="text-xs text-[#57534e]">{label}</dt>
      <dd className="text-xs font-medium font-mono text-[#a8a29e]">{value}</dd>
    </div>
  );
}
