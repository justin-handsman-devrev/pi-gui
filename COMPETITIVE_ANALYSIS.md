# AI Coding Assistant Feature Comparison Matrix

**Date:** 2026-05-24  
**Products Compared:**
1. **Claude Desktop** — Anthropic's native desktop chat app (macOS/Windows)
2. **Claude Code** — Anthropic's CLI/terminal coding agent (also available as VS Code/JetBrains extension and web)
3. **Cursor** — Fork of VS Code with deep AI integration
4. **Windsurf** (Codeium) — AI-native IDE (fork of VS Code)
5. **Claude Cowork** — Anthropic's collaborative multi-agent mode (preview)

---

## Executive Summary

| Dimension | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|-----------|---------------|-------------|--------|----------|---------------|
| **Form factor** | Desktop chat app | CLI + IDE extensions | AI IDE | AI IDE | Multi-agent canvas |
| **Target user** | General knowledge worker | Developer (terminal) | Developer (IDE) | Developer (IDE) | Team / power dev |
| **Model access** | Claude family | Claude family | Multi-model | Multi-model | Claude family |
| **MCP support** | ✅ Full | ✅ Full | ❌ Own protocol | ❌ Own protocol | ✅ (inherits) |
| **Agent autonomy** | Low | High | Medium | Medium | High (multi-agent) |
| **IDE integration** | None (standalone) | VS Code, JetBrains, Vim | Native IDE | Native IDE | Web canvas |
| **File editing** | Manual copy | Autonomous write | Inline diff | Inline diff | Autonomous write |
| **Canvas/Artifacts** | ✅ Artifacts | ❌ | ❌ | ❌ | ✅ Collaborative |
| **Collaboration** | Share links | Git-based | Git-based | Git-based | Real-time shared |

---

## 1. Core Chat / Conversation Features

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| Streaming responses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Markdown rendering | ✅ Full | ✅ (terminal) | ✅ Full | ✅ Full | ✅ Full |
| Code block syntax highlighting | ✅ | ⚠️ Basic (terminal) | ✅ Rich | ✅ Rich | ✅ Rich |
| Code block copy button | ✅ | ✅ (via clipboard) | ✅ | ✅ | ✅ |
| File reference / attachment | ✅ Files, images, PDFs | ✅ Full project context | ✅ @-mentions | ✅ @-mentions | ✅ |
| Image understanding (vision) | ✅ | ✅ (via paths) | ✅ (paste/drag) | ✅ (paste/drag) | ✅ |
| Multi-turn conversation | ✅ | ✅ | ✅ | ✅ | ✅ |
| System prompts / custom instructions | ✅ Per-project | ✅ CLAUDE.md files | ✅ .cursorrules | ✅ .windsurfrules | ✅ |
| Message editing / regeneration | ✅ | ✅ (resume session) | ✅ Edit & retry | ✅ Edit & retry | ✅ |
| Stop generation mid-stream | ✅ | ✅ (Ctrl+C) | ✅ | ✅ | ✅ |
| Voice input | ✅ | ❌ | ❌ | ❌ | ❌ |
| LaTeX / math rendering | ✅ | ❌ | ❌ | ❌ | ✅ |
| Table rendering | ✅ | ✅ (markdown) | ✅ | ✅ | ✅ |

---

## 2. Agent Capabilities

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Tool use / function calling** | ✅ Built-in tools | ✅ Extensive tool set | ✅ Built-in | ✅ Built-in | ✅ Multi-agent tools |
| File read | ✅ (via attachment) | ✅ Read tool | ✅ @file context | ✅ @file context | ✅ |
| File write / edit | ❌ Manual only | ✅ Write/Edit tools | ✅ Inline edit | ✅ Inline edit | ✅ |
| File create | ❌ | ✅ | ✅ | ✅ | ✅ |
| Terminal / shell execution | ❌ | ✅ Bash tool | ✅ Integrated terminal | ✅ Integrated terminal | ✅ |
| Grep / codebase search | ❌ | ✅ Grep/Glob tools | ✅ @codebase search | ✅ Codebase search | ✅ |
| Web search / fetch | ✅ (limited) | ✅ WebFetch tool | ❌ (manual paste) | ❌ (manual paste) | ✅ |
| Linter / type-checker integration | ❌ | ✅ Auto-runs | ✅ IDE linters | ✅ IDE linters | ✅ |
| Git operations | ❌ | ✅ Full git workflow | ✅ IDE git | ✅ IDE git | ✅ |
| Test execution | ❌ | ✅ Runs tests | ✅ Runs tests | ✅ Runs tests | ✅ |
| Multi-step autonomous tasks | ❌ | ✅ Full autonomy | ⚠️ Agent mode | ⚠️ Cascade mode | ✅ Multi-agent |
| Sub-agent spawning | ❌ | ✅ Agent SDK / Task tool | ❌ | ❌ | ✅ Core concept |
| Computer use (GUI automation) | ❌ | ✅ (preview) | ❌ | ❌ | ❌ |
| Permission modes (ask/auto) | ❌ | ✅ 3 modes | ⚠️ Auto-accept | ⚠️ Auto-accept | ✅ |

### Claude Code Tool Inventory
- **Read** — Read file contents
- **Write** — Create/overwrite files
- **Edit** — Search-and-replace in files (with fuzzy matching)
- **MultiEdit** — Edit multiple locations in one call
- **Bash** — Execute shell commands
- **Grep** — Search file contents (ripgrep)
- **Glob** — Find files by pattern
- **LS** — List directory contents
- **WebFetch** — Fetch web content
- **TodoRead/TodoWrite** — Task tracking
- **Task** — Spawn sub-agents
- **Computer** — GUI screenshot + click/type (preview)
- **NotebookEdit** — Jupyter notebook cell editing
- ** MCP tools** — Any MCP server tools

### Cursor Built-in Tools
- **@file** — Reference specific files
- **@folder** — Reference folder contents
- **@codebase** — Semantic search across codebase
- **@web** — Web search (via Perplexity integration)
- **@docs** — Reference documentation
- **@git** — Git history context
- **@definitions** — Code definitions
- **Terminal** — Integrated terminal commands
- **Apply model** — Apply edits inline

---

## 3. Project / Context Management

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Multi-file awareness** | ⚠️ Via attachments | ✅ Full workspace | ✅ Full workspace | ✅ Full workspace | ✅ |
| **Codebase indexing** | ❌ | ✅ Automatic | ✅ Codebase-wide | ✅ Codebase-wide | ✅ |
| **Semantic code search (RAG)** | ❌ | ✅ Grep + glob | ✅ @codebase | ✅ Indexing | ✅ |
| **Project-level instructions** | ✅ Projects | ✅ CLAUDE.md | ✅ .cursorrules | ✅ .windsurfrules | ✅ |
| **Directory tree awareness** | ❌ | ✅ LS tool | ✅ File explorer | ✅ File explorer | ✅ |
| **Context window visibility** | ❌ | ✅ Shows usage % | ❌ | ❌ | ⚠️ Partial |
| **File exclusion patterns** | ⚠️ Limited | ✅ .claudeignore | ✅ .cursorignore | ✅ .gitignore-based | ✅ |
| **Auto-context selection** | ⚠️ Manual attach | ✅ Smart context | ✅ Auto-context | ✅ Cascade auto | ✅ |
| **Dependency graph awareness** | ❌ | ⚠️ Via grep | ✅ Symbol refs | ✅ Symbol refs | ⚠️ |
| **Environment/package awareness** | ❌ | ✅ Reads package.json | ✅ IDE aware | ✅ IDE aware | ✅ |
| **Context caching** | ✅ (API-level) | ✅ Prompt caching | ⚠️ Provider-specific | ⚠️ Provider-specific | ✅ |

---

## 4. UI Features & Layout

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Chat sidebar** | ❌ (full window) | ❌ (terminal inline) | ✅ Side panel | ✅ Side panel | ✅ Side panel |
| **Chat panel / tab** | ✅ Main view | ✅ Terminal view | ✅ Tabbed panel | ✅ Tabbed panel | ✅ Canvas |
| **Inline code editing (diff)** | ❌ | ❌ (CLI shows patches) | ✅ Inline diff view | ✅ Inline diff view | ✅ |
| **Split views** | ❌ | ❌ (tmux possible) | ✅ Editor + chat | ✅ Editor + chat | ✅ |
| **Tab management** | ✅ (conversations) | ⚠️ (tmux/screen) | ✅ Multiple tabs | ✅ Multiple tabs | ✅ |
| **Diff view (before/after)** | ❌ | ⚠️ Patch display | ✅ Rich inline diff | ✅ Rich inline diff | ✅ |
| **File tree browser** | ❌ | ❌ (LS tool) | ✅ Full explorer | ✅ Full explorer | ⚠️ Contextual |
| **Minimap** | ❌ | ❌ | ✅ Code minimap | ✅ Code minimap | ❌ |
| **Breadcrumbs** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Command palette** | ❌ | ❌ | ✅ (Cmd+Shift+P) | ✅ (Cmd+Shift+P) | ⚠️ |
| **Status bar / indicators** | ✅ Streaming dots | ✅ Spinner + cost | ✅ IDE status bar | ✅ IDE status bar | ✅ |
| **Multi-window** | ✅ Multiple chats | ✅ Multiple terminals | ✅ Multiple editors | ✅ Multiple editors | ✅ |
| **Compact / zen mode** | ❌ | ✅ (terminal) | ✅ Zen mode | ✅ Zen mode | ❌ |
| **Responsive layout** | ✅ | ❌ (fixed terminal) | ✅ | ✅ | ✅ |

---

## 5. Session Management

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Conversation history** | ✅ Persistent | ✅ Session files | ✅ Per-chat history | ✅ Per-chat history | ✅ |
| **Resume previous session** | ✅ Pick from list | ✅ `--resume` / `--continue` | ✅ Chat history | ✅ Chat history | ✅ |
| **Session branching** | ❌ | ⚠️ (edit message, fork) | ✅ Edit & branch | ✅ Edit & branch | ✅ |
| **Session export** | ✅ Copy / share link | ✅ JSON export | ⚠️ Copy | ⚠️ Copy | ✅ |
| **Session naming** | ✅ Auto-titled | ⚠️ Manual | ✅ Auto-titled | ✅ Auto-titled | ✅ |
| **Pin / star conversations** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Search across conversations** | ✅ Full-text search | ⚠️ (grep session files) | ❌ | ❌ | ✅ |
| **Session undo/rollback** | ❌ | ✅ Git-based rollback | ✅ Git-based | ✅ Git-based | ✅ |
| **Session sharing** | ✅ Share link | ❌ | ❌ | ❌ | ✅ Collaborative |
| **Session import** | ❌ | ❌ | ❌ | ❌ | ⚠️ |

---

## 6. Settings & Model Configuration

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Model selection** | ✅ (Sonnet, Opus, Haiku) | ✅ (Sonnet, Opus, Haiku) | ✅ Multi-provider | ✅ Multi-provider | ✅ |
| **Thinking / reasoning levels** | ✅ Toggle extended thinking | ✅ `--thinking` budget | ⚠️ Via model choice | ⚠️ Via model choice | ✅ |
| **Model params (temp, top-p)** | ❌ | ⚠️ Via config | ⚠️ Limited | ⚠️ Limited | ⚠️ |
| **API key configuration** | ✅ OAuth login | ✅ API key / OAuth | ✅ API key | ✅ API key | ✅ OAuth |
| **MCP server configuration** | ✅ JSON config | ✅ JSON config | ❌ | ❌ | ✅ |
| **Custom tools** | ✅ Via MCP | ✅ Via MCP + hooks | ⚠️ Via extensions | ⚠️ Via extensions | ✅ Via MCP |
| **Permission configuration** | ⚠️ Basic | ✅ 3 tiers + allowlists | ⚠️ Auto-accept toggle | ⚠️ Auto-accept toggle | ✅ |
| **Usage / billing dashboard** | ✅ Plan info | ✅ Cost tracking | ✅ Usage display | ✅ Usage display | ✅ |
| **Theme selection** | ✅ Light/dark/system | ❌ (terminal theme) | ✅ Light/dark/hc | ✅ Light/dark/hc | ✅ |
| **Language / locale** | ✅ Multi-language | ❌ English | ✅ Multi-language | ✅ Multi-language | ✅ |
| **Notification settings** | ✅ | ❌ | ✅ IDE notifications | ✅ IDE notifications | ✅ |
| **Keyboard shortcuts** | ✅ Basic set | ✅ Vim keybindings | ✅ Full VS Code set | ✅ Full VS Code set | ✅ |

---

## 7. Extensions & Integrations

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **MCP (Model Context Protocol)** | ✅ Full support | ✅ Full support | ❌ | ❌ | ✅ Full support |
| **VS Code extension** | ❌ | ✅ Official extension | ✅ Native | ✅ Native | ❌ |
| **JetBrains plugin** | ❌ | ✅ Official plugin | ❌ | ❌ | ❌ |
| **Vim/Neovim integration** | ❌ | ✅ Headless mode | ❌ | ❌ | ❌ |
| **Git integration** | ❌ Standalone | ✅ Full git | ✅ IDE git | ✅ IDE git | ✅ |
| **GitHub integration** | ❌ | ✅ PR/Issue aware | ✅ PR/Issue | ✅ PR/Issue | ✅ |
| **Slack integration** | ❌ | ✅ Slack bot | ❌ | ❌ | ✅ |
| **CI/CD integration** | ❌ | ✅ GitHub Actions | ❌ | ❌ | ✅ |
| **Jupyter notebooks** | ❌ | ✅ NotebookEdit | ✅ Native | ✅ Native | ✅ |
| **Docker / containerization** | ❌ | ✅ Runs commands | ✅ Runs commands | ✅ Runs commands | ✅ |
| **Third-party extensions marketplace** | ❌ | ❌ | ✅ VS Code marketplace | ✅ VS Code marketplace | ❌ |
| **Custom extension API** | ✅ Via MCP | ✅ MCP + Hooks | ✅ VS Code extension API | ✅ VS Code extension API | ✅ MCP |
| **Browser extension** | ❌ | ✅ Chrome extension | ❌ | ❌ | ❌ |
| **IDE / Editor presence** | Standalone | CLI-first, IDE plugins | Full IDE | Full IDE | Web canvas |

---

## 8. Collaboration Features

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Shared sessions (real-time)** | ❌ | ❌ | ❌ | ❌ | ✅ Core feature |
| **Share conversation link** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Code review integration** | ❌ | ✅ PR review mode | ⚠️ Via PR sidebar | ⚠️ Via PR sidebar | ✅ |
| **Multi-agent collaboration** | ❌ | ✅ Sub-agents (Task) | ❌ | ❌ | ✅ Core feature |
| **Team workspaces** | ❌ | ⚠️ (shared config) | ❌ | ❌ | ✅ |
| **Role-based agent assignment** | ❌ | ⚠️ (via prompts) | ❌ | ❌ | ✅ Specialized agents |
| **Comment / annotation on output** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Approval workflow for edits** | ❌ | ✅ Permission modes | ✅ Diff review | ✅ Diff review | ✅ |
| **Audit trail / activity log** | ❌ | ✅ Session transcripts | ⚠️ Chat history | ⚠️ Chat history | ✅ |

---

## 9. Canvas / Artifacts / Previews

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Artifacts (rendered previews)** | ✅ Full artifacts | ❌ | ❌ | ❌ | ✅ Enhanced artifacts |
| **HTML preview** | ✅ | ❌ | ✅ Live preview | ✅ Live preview | ✅ |
| **React / component preview** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Mermaid / diagram rendering** | ✅ | ❌ | ⚠️ Via extension | ⚠️ Via extension | ✅ |
| **SVG rendering** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Document writing surface** | ✅ Artifact canvas | ❌ | ❌ | ❌ | ✅ Collaborative canvas |
| **Code playground** | ✅ Artifact execution | ❌ | ✅ Code runner | ✅ Code runner | ✅ |
| **Image generation** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Interactive widgets** | ✅ Artifact interactivity | ❌ | ❌ | ❌ | ✅ |
| **Side-by-side view (code + preview)** | ✅ | ❌ | ✅ Split editor | ✅ Split editor | ✅ |
| **Artifact versioning** | ⚠️ Basic | ❌ | ❌ | ❌ | ✅ |
| **Export artifact** | ✅ Copy / download | ❌ | ✅ Save file | ✅ Save file | ✅ |

---

## 10. Keyboard Shortcuts & Power-User Features

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Chat focus shortcut** | ⌘K | Escape | ⌘L | ⌘L | ⌘K |
| **New conversation** | ⌘N | `claude` | ⌘N | ⌘N | ⌘N |
| **Send message** | Enter / ⌘Enter | Enter | Enter / ⌘Enter | Enter / ⌘Enter | Enter |
| **Toggle sidebar** | ❌ | N/A | ⌘B | ⌘B | ⌘B |
| **Inline edit (selection)** | ❌ | ❌ | ⌘K (selection) | ⌘K (selection) | ⌘K |
| **Accept / reject edit** | ❌ | y/n | ⌘Y / ⌘N | ⌘Y / ⌘N | ⌘Y / ⌘N |
| **Navigate history** | ↑/↓ arrows | ↑/↓ arrows | ↑/↓ arrows | ↑/↓ arrows | ↑/↓ |
| **File quick-open** | ❌ | ❌ | ⌘P | ⌘P | ⌘P |
| **Command palette** | ❌ | ❌ | ⌘⇧P | ⌘⇧P | ⌘⇧P |
| **Vim keybindings** | ❌ | ✅ | ✅ Via extension | ✅ Via extension | ❌ |
| **Tab autocomplete** | ❌ | ❌ | ✅ Copilot++ | ✅ | ❌ |
| **Multi-line input** | ⌘⇧Enter | ✅ (editor) | ⌥Enter | ⌥Enter | ✅ |
| **Attach file shortcut** | ⌘⇧A | ❌ (auto-context) | @file | @file | ⌘⇧A |
| **Slash commands** | ❌ | ✅ /help, /compact, etc. | ✅ / commands | ✅ / commands | ✅ |

### Claude Code Slash Commands
| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/compact` | Compact conversation to reduce context |
| `/clear` | Clear conversation history |
| `/cost` | Show token usage and cost |
| `/doctor` | Check installation health |
| `/init` | Initialize project CLAUDE.md |
| `/memory` | Edit CLAUDE.md memory files |
| `/model` | Switch model |
| `/permissions` | Manage tool permissions |
| `/review` | Code review mode |
| `/status` | Show current status |
| `/vim` | Toggle vim keybindings |
| `/bug` | Report a bug |

---

## 11. Notification / Status Indicators

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Streaming indicator** | ✅ Animated dots | ✅ Spinner | ✅ Animated dots | ✅ Animated dots | ✅ |
| **Token usage display** | ❌ | ✅ Live counter | ⚠️ Per-query | ⚠️ Per-query | ✅ |
| **Cost tracking** | ❌ | ✅ Per-session | ⚠️ | ⚠️ | ✅ |
| **Model indicator** | ✅ In header | ✅ In prompt | ✅ In chat | ✅ In chat | ✅ |
| **Error notification** | ✅ Toast | ✅ Inline error | ✅ Toast + inline | ✅ Toast + inline | ✅ |
| **File change indicator** | ❌ | ✅ Diff summary | ✅ File decorations | ✅ File decorations | ✅ |
| **Tool execution status** | ❌ | ✅ Live tool log | ⚠️ Partial | ⚠️ Partial | ✅ |
| **Background task indicator** | ❌ | ✅ | ❌ | ✅ Cascade indicator | ✅ |
| **Permission prompt** | ❌ | ✅ y/n prompt | ✅ Accept/reject | ✅ Accept/reject | ✅ |
| **Rate limit warning** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 12. Search & Navigation

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Search across conversations** | ✅ Full-text | ⚠️ (grep files) | ❌ | ❌ | ✅ |
| **Search within conversation** | ✅ ⌘F | ⚠️ (terminal scroll) | ✅ ⌘F | ✅ ⌘F | ✅ |
| **Filter conversations by date** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Filter by project** | ✅ | ✅ (per-directory) | ✅ (per-workspace) | ✅ (per-workspace) | ✅ |
| **Bookmark / pin messages** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Jump to code reference** | ❌ | ❌ | ✅ Go to definition | ✅ Go to definition | ⚠️ |
| **Breadcrumb navigation** | ❌ | ❌ | ✅ File path | ✅ File path | ❌ |
| **Global search (codebase)** | ❌ | ✅ Grep tool | ✅ ⌘⇧F | ✅ ⌘⇧F | ✅ |
| **Symbol search** | ❌ | ❌ | ✅ ⌘T | ✅ ⌘T | ⚠️ |

---

## 13. Export / Share Functionality

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Copy conversation** | ✅ | ✅ | ⚠️ Copy messages | ⚠️ Copy messages | ✅ |
| **Export as Markdown** | ❌ | ✅ Session files | ❌ | ❌ | ✅ |
| **Export as JSON** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Share public link** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Export artifact** | ✅ Download | ❌ | ✅ Save to file | ✅ Save to file | ✅ |
| **Screenshot conversation** | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| **Print conversation** | ⌘P | ❌ | ⌘P | ⌘P | ⌘P |

---

## 14. Theming & Customization

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Dark mode** | ✅ | ✅ (terminal) | ✅ | ✅ | ✅ |
| **Light mode** | ✅ | ✅ (terminal) | ✅ | ✅ | ✅ |
| **System theme follow** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Custom color themes** | ❌ | ❌ | ✅ VS Code themes | ✅ VS Code themes | ⚠️ Limited |
| **High contrast mode** | ❌ | ❌ | ✅ | ✅ | ⚠️ |
| **Font size adjustment** | ✅ | ✅ (terminal) | ✅ | ✅ | ✅ |
| **Custom CSS injection** | ❌ | ❌ | ✅ Via extension | ✅ Via extension | ❌ |
| **Layout customization** | ⚠️ Limited | ❌ | ✅ Full panel layout | ✅ Full panel layout | ⚠️ |
| **Icon theme** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Custom keybindings** | ❌ | ✅ Vim mode | ✅ Full VS Code | ✅ Full VS Code | ⚠️ |

---

## 15. Platform & Availability

| Feature | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|---------|:---:|:---:|:---:|:---:|:---:|
| **macOS** | ✅ | ✅ | ✅ | ✅ | ✅ (web) |
| **Windows** | ✅ | ✅ | ✅ | ✅ | ✅ (web) |
| **Linux** | ❌ (web only) | ✅ | ✅ | ✅ | ✅ (web) |
| **Web browser** | ✅ claude.ai | ✅ claude.ai/code | ❌ | ❌ | ✅ |
| **VS Code extension** | ❌ | ✅ | ✅ (native) | ✅ (native) | ❌ |
| **JetBrains plugin** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Mobile** | ✅ iOS/Android | ❌ | ❌ | ❌ | ✅ (web) |
| **API access** | ❌ (uses own) | ✅ API key | ✅ Bring your own | ✅ Bring your own | ❌ |

---

## 16. Pricing Model (as of 2026-05)

| Tier | Claude Desktop | Claude Code | Cursor | Windsurf | Claude Cowork |
|------|---------------|-------------|--------|----------|---------------|
| **Free** | ✅ Usage-limited | ✅ (OAuth) | ✅ Basic | ✅ Basic | ⚠️ Preview |
| **Pro** | $20/mo (Pro) | Included in Pro | $20/mo (Pro) | $15/mo (Pro) | Included in Pro |
| **Team/Business** | ✅ | ✅ Max plan | ✅ Business ($40/user) | ✅ Teams | ✅ |
| **Enterprise** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **API-based** | ❌ | ✅ Pay-per-token | ✅ BYO key | ✅ BYO key | ❌ |
| **Usage limits** | Per-plan cap | Per-plan cap | 500/mo Pro | Unlimited Cascade | Per-plan cap |

---

## Key Differentiators

### Claude Desktop
- **Strengths:** Artifacts canvas, clean UI, image/PDF upload, voice input, share links, MCP support, mobile apps
- **Weaknesses:** No file editing, no terminal, no IDE integration, limited project context
- **Best for:** Knowledge workers, document creation, brainstorming, visual content

### Claude Code
- **Strengths:** Full autonomy, terminal-first, MCP support, git integration, multi-agent spawning, CI/CD, 20+ built-in tools, session management, cost tracking
- **Weaknesses:** No GUI, no Artifacts, no inline diff view, terminal-only UX
- **Best for:** Power developers, CI/CD automation, code review, complex multi-step tasks

### Cursor
- **Strengths:** Full IDE, inline diff editing, multi-model support, tab autocomplete (Copilot++), codebase indexing, VS Code ecosystem
- **Weaknesses:** No MCP support, no Artifacts, proprietary protocols, single-agent only
- **Best for:** IDE-native developers wanting AI-assisted coding without leaving their editor

### Windsurf
- **Strengths:** Cascade multi-step agent, flow awareness, real-time codebase indexing, IDE-native, VS Code ecosystem
- **Weaknesses:** No MCP support, no Artifacts, less mature than Cursor
- **Best for:** Developers wanting autonomous agent workflows inside an IDE

### Claude Cowork
- **Strengths:** Multi-agent collaboration, real-time shared sessions, specialized agent roles, Artifacts, team workflows
- **Weaknesses:** Preview/beta, no standalone desktop app, limited maturity
- **Best for:** Teams, complex multi-agent tasks, collaborative code review

---

## MCP Server Ecosystem (Claude Desktop + Claude Code + Cowork)

Since MCP is a key differentiator for the Anthropic ecosystem, here's the server landscape:

| Category | Example MCP Servers | Capability |
|----------|-------------------|------------|
| **Database** | @modelcontextprotocol/server-postgres, server-sqlite | Direct DB queries |
| **Filesystem** | @modelcontextprotocol/server-filesystem | File operations |
| **GitHub** | @modelcontextprotocol/server-github | PR/Issue/Repo ops |
| **Git** | @modelcontextprotocol/server-git | Local git operations |
| **Web** | @modelcontextprotocol/server-fetch, server-puppeteer | Web scraping, browsing |
| **Slack** | @modelcontextprotocol/server-slack | Read/write Slack |
| **Google** | server-google-maps, server-google-calendar | Google services |
| **Memory** | @modelcontextprotocol/server-memory | Persistent memory |
| **Sequential Thinking** | @modelcontextprotocol/server-sequential-thinking | Structured reasoning |
| **Custom** | Any MCP-compatible server | Unlimited extensibility |

---

## Methodology

This comparison was compiled from:
- Official product documentation (Anthropic docs, Cursor docs, Windsurf/Codeium docs)
- Direct product usage and observation
- Release notes and changelogs (through May 2026)
- Community documentation and reviews

**Confidence levels:**
- Claude Desktop / Claude Code: **High** (well-documented, stable products)
- Cursor: **High** (mature, well-documented IDE)
- Windsurf: **Medium-High** (rapidly evolving, features may shift)
- Claude Cowork: **Medium** (preview product, features subject to change)

---

## Recommendations for pi-gui

Based on this competitive analysis, key opportunities for differentiation:

1. **MCP-first architecture** — Only Claude Desktop/Code/Cowork support MCP; combining MCP with an IDE-native GUI is a greenfield opportunity
2. **Canvas + Agent** — No product combines a rich Artifacts-like canvas with autonomous agent capabilities in one UI
3. **Session management** — Most products have weak session search, branching, and cross-referencing; there's room for best-in-class session UX
4. **Multi-agent visualization** — Claude Cowork is the only product with multi-agent collaboration, but it lacks a mature visual interface for agent orchestration
5. **Theme customization** — The warm editorial design system (from DESIGN.md) is distinctive vs. the cold developer-tool aesthetic of Cursor/Windsurf
