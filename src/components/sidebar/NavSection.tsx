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
              group flex items-center gap-2.5 rounded-md px-2.5 py-1.5
              text-[13px] font-medium
              transition-all duration-150 ease-out
              ${
                isActive
                  ? "bg-violet-500/10 text-violet-400 border-l-2 border-violet-500 pl-[calc(0.625rem-2px)]"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border-l-2 border-transparent pl-[calc(0.625rem-2px)]"
              }
            `}
          >
            <span
              className={`shrink-0 transition-colors duration-150 ${
                isActive ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-400"
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1 truncate text-left">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-700 px-1.5 text-[10px] font-semibold tabular-nums text-zinc-300">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
