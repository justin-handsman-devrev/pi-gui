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
        <FolderOpen size={24} className="mx-auto mb-2 text-zinc-600" />
        <p className="text-xs text-zinc-500">No projects yet</p>
        <p className="mt-0.5 text-[11px] text-zinc-600">
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
          group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5
          text-[13px] transition-all duration-150 ease-out
          text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100
        `}
      >
        {/* Expand chevron */}
        <span
          className={`shrink-0 transition-transform duration-150 ${
            hasSessions ? "text-zinc-500" : "text-zinc-700"
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

        <FolderOpen size={14} className="shrink-0 text-zinc-500" />

        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="truncate font-medium">{project.name}</span>
          <span className="w-full truncate font-mono text-[10px] text-zinc-500">
            {shortPath(project.path)}
          </span>
        </div>

        {hasSessions && (
          <span className="shrink-0 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-500">
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
            <div className="ml-5 flex flex-col gap-0.5 border-l border-zinc-800 pl-3 py-0.5">
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
                      group flex w-full items-center gap-2 rounded-md px-2 py-1.5
                      text-[12px] transition-all duration-150 ease-out
                      text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200
                    "
                  >
                    <MessageSquare size={12} className="shrink-0 text-zinc-600 group-hover:text-zinc-400" />
                    <span className="flex-1 truncate text-left">
                      {session.name}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">
                      {formatDistanceToNow(new Date(session.lastActive), {
                        addSuffix: false,
                      })}
                    </span>
                    {session.messageCount > 0 && (
                      <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">
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
