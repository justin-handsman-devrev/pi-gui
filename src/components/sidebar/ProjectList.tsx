import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, FolderOpen, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUIStore, type Project } from "@/stores/uiStore";

/** Shorten a path to the last two segments for compact display. */
function shortPath(fullPath: string): string {
  const parts = fullPath.replace(/\/$/, "").split("/");
  if (parts.length <= 2) return fullPath;
  return ".../" + parts.slice(-2).join("/");
}

export default function ProjectList() {
  const projects = useUIStore((s) => s.projects);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  if (projects.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <FolderOpen size={24} className="mx-auto mb-2 text-[#57534e]" />
        <p className="text-xs text-[#78716c]">No projects yet</p>
        <p className="mt-0.5 text-[11px] text-[#57534e]">
          Start a session to see it here
        </p>
      </div>
    );
  }

  // Sort projects by lastActive (most recent first)
  const sorted = [...projects].sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  );

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {sorted.map((project) => (
        <ProjectItem
          key={project.path}
          project={project}
          expanded={expandedPaths.has(project.path)}
          onToggle={() => toggleExpand(project.path)}
        />
      ))}
    </div>
  );
}

interface ProjectItemProps {
  project: Project;
  expanded: boolean;
  onToggle: () => void;
}

function ProjectItem({ project, expanded, onToggle }: ProjectItemProps) {
  const hasSessions = project.sessions.length > 0;

  return (
    <div>
      {/* Project row */}
      <button
        onClick={hasSessions ? onToggle : undefined}
        className={`
          group flex w-full items-center gap-1.5 rounded-lg px-2 py-2
          text-[13px] transition-all duration-150 ease-out
          text-[#a8a29e] hover:bg-[#44403c]/30 hover:text-[#fafaf9]
        `}
      >
        {/* Expand chevron */}
        <span
          className={`shrink-0 transition-transform duration-150 ${
            hasSessions ? "text-[#78716c]" : "text-[#44403c]"
          }`}
        >
          {hasSessions && (
            <motion.span
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: "flex" }}
            >
              <ChevronRight size={14} />
            </motion.span>
          )}
          {!hasSessions && <ChevronRight size={14} className="opacity-0" />}
        </span>

        <FolderOpen size={14} className="shrink-0 text-[#78716c]" />

        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="truncate font-medium text-[#fafaf9]">{project.name}</span>
          <span className="w-full truncate font-mono text-[10px] text-[#78716c]">
            {shortPath(project.path)}
          </span>
        </div>

        {hasSessions && (
          <span className="shrink-0 rounded-full bg-[#44403c] px-1.5 py-0.5 text-[10px] tabular-nums text-[#a8a29e]">
            {project.sessions.length}
          </span>
        )}
      </button>

      {/* Sessions */}
      <AnimatePresence initial={false}>
        {expanded && hasSessions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-5 flex flex-col gap-0.5 border-l border-white/[0.06] pl-3 py-0.5">
              {project.sessions
                .sort(
                  (a, b) =>
                    new Date(b.lastActive).getTime() -
                    new Date(a.lastActive).getTime()
                )
                .map((session) => (
                  <button
                    key={session.id}
                    className="
                      group flex w-full items-center gap-2 rounded-lg px-2 py-1.5
                      text-[12px] transition-all duration-150 ease-out
                      text-[#a8a29e] hover:bg-[#44403c]/30 hover:text-[#fafaf9]
                    "
                  >
                    <MessageSquare size={12} className="shrink-0 text-[#57534e] group-hover:text-[#78716c]" />
                    <span className="flex-1 truncate text-left">
                      {session.name}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-[#57534e]">
                      {formatDistanceToNow(new Date(session.lastActive), {
                        addSuffix: false,
                      })}
                    </span>
                    {session.messageCount > 0 && (
                      <span className="shrink-0 text-[10px] tabular-nums text-[#57534e]">
                        {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
