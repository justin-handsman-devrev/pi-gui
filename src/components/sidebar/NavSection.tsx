import { type ReactNode } from "react";
import {
  MessageSquare,
  FolderOpen,
  Clock,
  Activity,
  Settings,
  Blocks,
} from "lucide-react";
import { useUIStore, type SidebarView } from "@/stores/uiStore";

interface NavItem {
  id: SidebarView;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chats", label: "Chats", icon: <MessageSquare size={13} strokeWidth={1.75} /> },
  { id: "projects", label: "Projects", icon: <FolderOpen size={13} strokeWidth={1.75} /> },
  { id: "scheduled", label: "Scheduled", icon: <Clock size={13} strokeWidth={1.75} /> },
  { id: "activity", label: "Activity", icon: <Activity size={13} strokeWidth={1.75} /> },
  { id: "extensions", label: "Extensions", icon: <Blocks size={13} strokeWidth={1.75} /> },
  { id: "settings", label: "Settings", icon: <Settings size={13} strokeWidth={1.75} /> },
];

export default function NavSection() {
  const sidebarView = useUIStore((s) => s.sidebarView);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSidebarView = useUIStore((s) => s.setSidebarView);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  const handleSelect = (id: SidebarView) => {
    setSidebarView(id);
    if (id === "settings") {
      setSettingsOpen(true);
      return;
    }
    setSettingsOpen(false);
    if (id === "extensions") {
      useUIStore.getState().setCanvasVisible(false);
    }
  };

  return (
    <nav className="sidebar-nav" aria-label="Sidebar navigation">
      {NAV_ITEMS.map((item) => {
        const active =
          item.id === "settings"
            ? settingsOpen || sidebarView === item.id
            : sidebarView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={`sidebar-nav-item${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
            title={item.label}
          >
            <span className="sidebar-nav-item-icon">{item.icon}</span>
            <span className="sidebar-nav-item-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
