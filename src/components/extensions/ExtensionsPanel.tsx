import { useUIStore } from "@/stores/uiStore";
import SkillsTab from "@/components/settings/SkillsTab";
import AgentsTab from "@/components/settings/AgentsTab";
import PromptLibraryTab from "@/components/settings/PromptLibraryTab";
import McpTab from "@/components/settings/McpTab";

export default function ExtensionsPanel() {
  const activeTab = useUIStore((s) => s.extensionsTab);

  return (
    <div className="extensions-panel">
      <div className="extensions-panel-bg" aria-hidden="true">
        <div className="orb orb-lavender extensions-panel-orb extensions-panel-orb-a" />
        <div className="orb orb-mint extensions-panel-orb extensions-panel-orb-b" />
      </div>

      <div className="extensions-panel-body">
        <div className="extensions-panel-content">
          {activeTab === "skills" && <SkillsTab embedded />}
          {activeTab === "agents" && <AgentsTab embedded />}
          {activeTab === "prompts" && <PromptLibraryTab embedded />}
          {activeTab === "mcp" && <McpTab embedded />}
        </div>
      </div>
    </div>
  );
}
