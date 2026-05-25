import type { ReactNode } from "react";

interface ChatWorkspaceProps {
  children: ReactNode;
}

export default function ChatWorkspace({ children }: ChatWorkspaceProps) {
  return (
    <div className="chat-workspace">
      <div className="chat-workspace-body">{children}</div>
    </div>
  );
}
