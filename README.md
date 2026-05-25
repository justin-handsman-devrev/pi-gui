# Pi GUI

A desktop interface for the [Pi coding agent](https://github.com/earendil-works/pi-coding-agent). Pi GUI wraps the Pi CLI in a native app so you can chat with the agent, browse and edit files, review diffs, and manage extensions — without living in the terminal.

Built with **Tauri 2**, **React 19**, and **TypeScript**.

**Repository:** https://github.com/justin-handsman-devrev/pi-gui

---

## What it does

Pi GUI talks to Pi over RPC (`pi --mode rpc`). The app spawns the agent for your chosen project directory and streams messages, tool calls, and state into the UI.

| Area | Description |
|------|-------------|
| **Chat** | Multi-session conversations, streaming responses, thinking blocks, tool-call timeline, slash commands |
| **Canvas** | File tree, editor, diffs, git panel |
| **Extensions** | Skills, subagent profiles, prompt library, MCP server configs (local CRUD; sync to Pi config as you wire it up) |
| **Settings** | Theme, font size, app zoom, model & thinking level, usage stats |
| **Footer** | Model selector, thinking controls, workspace, token/cost status, theme & zoom |

Sessions and agent state live where Pi stores them (typically `~/.pi/agent/`).

---

## Prerequisites

1. **[Node.js](https://nodejs.org/)** 18 or later (for the frontend and the Pi CLI)
2. **[Rust](https://www.rust-lang.org/tools/install)** — required to build the Tauri shell  
   - macOS: Xcode Command Line Tools  
   - Linux: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)  
   - Windows: Visual Studio Build Tools + WebView2
3. **Pi coding agent CLI** on your `PATH`:

   ```bash
   npm install -g @earendil-works/pi-coding-agent
   ```

   Verify:

   ```bash
   pi --version
   which pi
   ```

4. **Pi configured** with your model provider API keys (same as using Pi in the terminal — usually under `~/.pi/agent/`).

---

## Install & run (development)

```bash
git clone https://github.com/justin-handsman-devrev/pi-gui.git
cd pi-gui
npm install
npm run tauri dev
```

On first launch, pick a **project directory**. Pi GUI starts the agent with that folder as the working directory.

The Vite dev server runs on port **1420**; Tauri opens a native window pointed at it.

---

## Build a release

```bash
npm run tauri build
```

Installers and binaries are written under `src-tauri/target/release/bundle/` (format depends on your OS).

---

## Project layout

```
pi-gui/
├── src/                 # React frontend
│   ├── components/      # Chat, sidebar, settings, extensions
│   ├── canvas/          # File editor & git UI
│   ├── hooks/           # Agent events, keyboard shortcuts
│   ├── lib/             # Tauri command wrappers, session helpers
│   └── stores/          # Zustand state
├── src-tauri/           # Rust backend
│   └── src/
│       ├── rpc_bridge.rs   # Spawns pi --mode rpc, streams events
│       ├── commands.rs     # Tauri invoke handlers
│       └── …
└── package.json
```

---

## Troubleshooting

**“Could not find `pi`”**  
Install the global CLI and ensure `pi` is on your PATH. GUI apps often see a minimal PATH; Pi GUI searches common locations (`/opt/homebrew/bin`, `/usr/local/bin`, etc.) and your login shell.

**“Could not find `node`”**  
Pi’s npm global install is a Node script. Install Node.js and confirm `node` is available.

**Agent fails to start**  
Run Pi manually in the project folder to confirm config and API keys:

```bash
cd /path/to/your/project
pi
```

**Blank window in dev**  
Make sure nothing else is using port 1420, or restart `npm run tauri dev`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite only (browser, no Tauri) |
| `npm run tauri dev` | Full desktop app in development |
| `npm run build` | Typecheck + production frontend build |
| `npm run tauri build` | Production app bundle |

---

## License

See repository license file if present. Pi GUI is an independent UI for the Pi coding agent ecosystem.
