import { useUIStore } from "@/stores/uiStore";
import ChatWorkspace from "@/components/chat/ChatWorkspace";
import ChatView from "@/components/ChatView";
import PromptInput from "@/components/PromptInput";
import SessionTabs from "@/components/SessionTabs";
import ExtensionsPanel from "./ExtensionsPanel";

export default function MainPanel() {
  const sidebarView = useUIStore((s) => s.sidebarView);

  if (sidebarView === "extensions") {
    return (
      <ChatWorkspace>
        <ExtensionsPanel />
      </ChatWorkspace>
    );
  }

  return (
    <ChatWorkspace>
      <div className="el-main-panel">
        <SessionTabs />
        <ChatView />
        <PromptInput />
      </div>
    </ChatWorkspace>
  );
}
