import { ExternalLink, GitBranch, Info } from "lucide-react";
import { SettingSection } from "./settings-ui";

function detectSystem() {
  const platform = typeof navigator !== "undefined" ? navigator.platform : "";
  let os = "Unknown";
  let arch = "";

  if (platform.includes("Mac") || platform.includes("Darwin")) {
    os = "macOS";
    arch = platform.includes("arm") || platform.includes("ARM") ? "Apple Silicon" : "Intel";
  } else if (platform.includes("Win")) {
    os = "Windows";
  } else if (platform.includes("Linux")) {
    os = "Linux";
  }

  const tauriVersion =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window ? "2.x" : "—";

  const renderer = `${navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] ?? "Unknown"} Chromium`;

  return { os, arch, tauriVersion, renderer };
}

export default function AboutTab() {
  const { os, arch, tauriVersion, renderer } = detectSystem();

  return (
    <div className="settings-page">
      <div className="settings-about-hero">
        <div className="settings-about-mark" aria-hidden="true">π</div>
        <h3 className="settings-about-name">Pi GUI</h3>
        <span className="settings-about-version">v0.1.0</span>
        <p className="settings-about-tagline">
          A desktop interface for the Pi coding agent — build, debug, and ship with an AI pair programmer.
        </p>
        <div className="settings-about-links">
          <a
            href="https://github.com/user/pi-gui"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline settings-about-link"
          >
            <GitBranch size={13} />
            GitHub
            <ExternalLink size={10} />
          </a>
          <a
            href="https://docs.pi-agent.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-warm settings-about-link"
          >
            Documentation
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      <SettingSection title="System" description="Runtime environment for this install.">
        <dl className="settings-info-grid">
          <div className="settings-info-row">
            <dt>Operating system</dt>
            <dd>{os}</dd>
          </div>
          {arch && (
            <div className="settings-info-row">
              <dt>Architecture</dt>
              <dd>{arch}</dd>
            </div>
          )}
          <div className="settings-info-row">
            <dt>Tauri</dt>
            <dd>{tauriVersion}</dd>
          </div>
          <div className="settings-info-row">
            <dt>App version</dt>
            <dd>0.1.0</dd>
          </div>
          <div className="settings-info-row">
            <dt>Renderer</dt>
            <dd>{renderer}</dd>
          </div>
        </dl>
      </SettingSection>

      <div className="ext-callout settings-about-callout">
        <Info size={14} />
        <p>
          Built with Tauri, React, and the ElevenLabs-inspired design system.
          Pi Agent · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
