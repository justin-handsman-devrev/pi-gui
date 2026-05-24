import { type ReactNode } from "react";
import {
  MessageSquare,
  FolderOpen,
  Clock,
  Settings,
} from "lucide-react";
import { useUIStore, type SidebarView } from "@/stores/uiStore";

interface NavItem {
  id: SidebarView;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface NavSectionProps {
  items?: NavItem[];
}

const defaultItems: NavItem[] = [
  {
    id: "chats",
    label: "Chats",
    icon: <MessageSquare size={16} />,
  },
  {
    id: "projects",
    label: "Projects",
    icon: <FolderOpen size={16} />,
  },
  {
    id: "scheduled",
    label: "Scheduled",
    icon: <Clock size={16} />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={16} />,
  },
];

export default function NavSection({ items = defaultItems }: NavSectionProps) {
  const sidebarView = useUIStore((s) => s.sidebarView);
  const setSidebarView = useUIStore((s) => s.setSidebarView);

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {items.map((item) => {
        const isActive = sidebarView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setSidebarView(item.id)}
            className={`
              group flex items-center gap-2.5 rounded-lg px-3 py-2
              text-[13px] leading-[1.4] font-medium
              transition-all duration-150 ease-out
              ${
                isActive
                  ? "bg-[#44403c]/50 text-[#fafaf9] border-l-2 border-[#9d8bb8] pl-[calc(0.75rem-2px)]"
                  : "text-[#a8a29e] hover:bg-[#44403c]/30 hover:text-[#fafaf9] border-l-2 border-transparent pl-[calc(0.75rem-2px)]"
              }
            `}
          >
            <span
              className={`shrink-0 transition-colors duration-150 ${
                isActive ? "text-[#9d8bb8]" : "text-[#78716c] group-hover:text-[#a8a29e]"
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1 truncate text-left">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#44403c] px-1.5 text-[10px] font-semibold tabular-nums text-[#a8a29e]">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
