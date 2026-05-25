# Ralph Wiggum Loop — pi-gui Feature Parity Build

## Context

You are working on **pi-gui**, a Tauri desktop app for the `pi` coding agent.
Tech stack: React 19 + TypeScript + Tauri 2 + Vite + Tailwind v4 + framer-motion + zustand + react-resizable-panels + react-markdown + highlight.js

The app uses CSS custom properties (design tokens) defined in `src/styles/index.css`. All colors use `var(--token-name)` — NEVER hardcoded hex values.

The Rust backend in `src-tauri/` is a thin RPC bridge to `pi --mode rpc`. Commands: `start_agent`, `send_prompt`, `steer`, `abort_agent`, `new_session`, `get_state`, `set_model`, `get_available_models`, `set_thinking_level`, `compact_session`.

## Current State — What Exists

### Working:
- ✅ Startup screen (split hero + form)
- ✅ Sidebar with nav (Chats/Projects/Scheduled/Settings)
- ✅ Chat message list with markdown rendering (react-markdown + remark-gfm + rehype-highlight)
- ✅ Tool call panels (collapsible, per-tool icons, output viewer)
- ✅ Prompt input with model badge, steer/abort modes
- ✅ Canvas pane with file tabs, code editor (CodeMirror), diff renderer
- ✅ Settings panel (General/Model/Skills/MCP/About tabs)
- ✅ Status bar (model name, streaming indicator, token counts)
- ✅ Project/session sidebar list
- ✅ Light theme (ElevenLabs-inspired design system)

### Stub/Placeholder/Not Yet Built:
- ❌ **Session history & search** — no persistence of conversations, no search across sessions
- ❌ **Keyboard shortcuts** — no Cmd+K, Cmd+N, Cmd+P, Cmd+/ etc.
- ❌ **File tree / project browser** — no file explorer panel
- ❌ **Conversation branching** — can't fork a conversation from a past message
- ❌ **MCP server management** — tab exists but is a placeholder
- ❌ **Image/multimodal support** — can't paste/drop images
- ❌ **Notification system** — no toast/inline notifications for errors, completions
- ❌ **Auto-scroll control** — no "scroll to bottom" FAB when user scrolls up
- ❌ **Slash commands** — no `/compact`, `/model`, `/clear`, `/help` etc in the input
- ❌ **Context window indicator** — no visual gauge of context usage
- ❌ **Model selector dropdown** — ModelSelector.tsx and ThinkingSelector.tsx exist but may be stubs
- ❌ **Drag & drop** — no file drop onto chat
- ❌ **Export/share** — no conversation export or share link
- ❌ **Session rename** — can't rename sessions
- ❌ **Multi-session tabs** — no tab bar for switching between active sessions
- ❌ **Code actions** — no "Copy code", "Apply to file", "Open in canvas" buttons on code blocks
- ❌ **Thinking/reasoning display** — no collapsible thinking block rendering
- ❌ **Compact action** — no UI trigger for session compaction
- ❌ **Cost/token display** — stats exist in store but no detailed breakdown UI
- ❌ **Diff actions** — no accept/reject for individual edits
- ❌ **Sound/haptic feedback** — no completion/error sounds
- ❌ **Window title** — doesn't show model name or session name
- ❌ **Resizable sidebar** — sidebar is fixed 264px width
- ❌ **Theme toggle** — no light/dark switch (currently light only)

## Your Task

Build ALL of the missing features listed above, prioritizing by user impact. For each feature:

1. **Build it fully** — not a stub. Real working functionality.
2. **Use the design system** — all colors via `var(--token)`, spacing via `var(--sp-*)`, radii via `var(--r-*)`.
3. **Wire it to the backend** — use existing Tauri commands or add new ones to `src-tauri/src/commands.rs` and `src-tauri/src/rpc_bridge.rs` as needed. The RPC bridge talks to `pi --mode rpc`.
4. **Build passes** — run `npm run build` after changes to verify. TypeScript must compile.
5. **Maintain the light theme** — every new component must use design tokens, not hardcoded colors.

### Priority Order (build in this order):

**Phase 1 — Core UX (biggest impact):**
1. Keyboard shortcuts system (Cmd+N new session, Cmd+K command palette, Cmd+B toggle sidebar, Cmd+Enter send, Esc abort, Cmd+/ toggle shortcuts help)
2. Scroll-to-bottom FAB (appears when user scrolls up, shows unread count)
3. Slash commands in prompt input (parse `/compact`, `/model`, `/clear`, `/help`, `/clear`, `/compact`)
4. Notification toasts (bottom-right, auto-dismiss, for errors/completions/warnings)
5. Session rename (double-click in sidebar to rename)
6. Window title updates (show session name + model)

**Phase 2 — Power User Features:**
7. Model selector dropdown (fetch from `get_available_models`, show provider groups, thinking level toggle)
8. Thinking/reasoning display (collapsible blocks with `💭` prefix, dimmed style)
9. Context window indicator (progress bar in status bar or sidebar footer)
10. Compact action button (in sidebar footer or status bar)
11. Code block actions (copy button ✅ exists, add "Open in Canvas" button)
12. Conversation export (markdown export, JSON export)

**Phase 3 — Navigation & Management:**
13. Session history persistence (save to localStorage or file via Tauri)
14. Search across sessions (search bar in sidebar, filters messages)
15. Multi-session tabs (tab bar above chat for switching sessions)
16. Resizable sidebar (drag handle on right edge of sidebar)

**Phase 4 — Advanced:**
17. File tree / project browser (simple tree with folder expansion)
18. Image/multimodal support (paste images, render inline)
19. Drag & drop files onto chat
20. Diff accept/reject actions
21. Theme toggle (light/dark)
22. MCP server management (list servers, connect/disconnect, view tools)

## Rules

- NEVER use hardcoded hex colors. Always use `var(--token-name)`.
- NEVER break the build. Run `npm run build` to verify after changes.
- Keep the existing file structure. New components go in `src/components/`.
- Use existing stores (agentStore, uiStore, canvasStore). Add new stores only if needed.
- Follow the existing patterns: inline styles with CSS vars, Tailwind utility classes for layout.
- All interactive elements must have hover/focus states using the established pattern.
- Keep the ElevenLabs editorial aesthetic: EB Garamond for display, Inter for body.

## Completion Criteria

When ALL features in Phases 1-4 are implemented and working:
- `npm run build` passes with zero errors
- Every feature listed above is real, functional code — not a stub
- All new components use design tokens
- The app looks cohesive and professional

Output <promise>FEATURE PARITY COMPLETE</promise> when done.
