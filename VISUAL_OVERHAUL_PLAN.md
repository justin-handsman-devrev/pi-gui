# π GUI Visual Overhaul Plan
## ElevenLabs-Inspired Dark Editorial Theme

---

## Design Philosophy

Adapt the warm, refined ElevenLabs aesthetic to a dark developer tool:
- **Warm near-blacks** instead of cold zincs
- **Atmospheric aurora gradient orbs** (dark mode take on pastels: mint, peach, lavender, sky, rose)
- **Pill-shaped CTAs** everywhere
- **Stricter typography hierarchy** with negative tracking
- **Generous whitespace** inspired by editorial print design

---

## Color Migration

### From (Old)
```
bg-zinc-950: #09090b
bg-zinc-900: #18181b
bg-zinc-800: #27272a
violet-500:  #8b5cf6 (saturated)
```

### To (New ElevenLabs-Inspired)
```
--canvas-primary:   #0c0a09  (warm near-black)
--canvas-surface:   #131210  (subtle warmth)
--canvas-elevated:  #1c1917  (ink-900)
--ink-700:          #44403c  (elevated)
--ink-600:          #57534e  (borders)
--aurora-lavender:  #9d8bb8  (soft, not saturated)
--aurora-mint:      #5fb8a3
--aurora-peach:     #d4a88c
--aurora-sky:       #7da8c8
--aurora-rose:      #c494a4
```

---

## Parallel Implementation Tasks

### Agent 1: Design System + Global Styles
**Scope:** Replace index.css with new design tokens
**Files:**
- `src/styles/index.css` — Full rewrite with new tokens
- `tailwind.config.ts` — Update colors if needed
- `src/main.tsx` — Import new theme

**Requirements:**
- Import Inter font from Google Fonts
- All new CSS custom properties
- Aurora orb keyframe animations
- Pill button utility classes
- New scrollbar styling
- Syntax highlighting theme (aurora)

### Agent 2: Startup Screen + App.tsx
**Scope:** Apply new design to startup and main layout
**Files:**
- `src/App.tsx`
- `src/components/sidebar/Sidebar.tsx` (wrapper integration)

**Requirements:**
- Startup screen: Large π with aurora orb glow behind it
- New pill-shaped "Start" button
- Warm near-black background
- Typography with negative tracking on π logo
- Remove gradients on CTAs, use solid ink
- Subtle aurora orbs in background (fixed position)

### Agent 3: Sidebar Components
**Scope:** Redesign sidebar with new aesthetic
**Files:**
- `src/components/sidebar/Sidebar.tsx`
- `src/components/sidebar/NavSection.tsx`
- `src/components/sidebar/ProjectList.tsx`
- `src/components/sidebar/SidebarFooter.tsx`

**Requirements:**
- Warm gray backgrounds (#1c1917, #131210)
- Pill-shaped "New Chat" button (solid ink, not gradient)
- Hairline borders instead of heavy zinc-800
- Softer text hierarchy
- Aurora orb subtle glow in header area
- Expand animation with spring physics

### Agent 4: Chat Components
**Scope:** Message bubbles, input, status bar
**Files:**
- `src/components/ChatView.tsx`
- `src/components/MessageBubble.tsx`
- `src/components/PromptInput.tsx`
- `src/components/StatusBar.tsx`
- `src/components/ToolCallPanel.tsx`

**Requirements:**
- Message bubbles: Refined styling, subtle shadows
- User message: Aurora lavender accent (not saturated violet)
- Code blocks: Warm dark theme with aurora syntax
- Input: Rounded pill-like appearance (not sharp corners)
- Status bar: Minimal, hairline border
- Tool call panels: Refined with ink-700 backgrounds

### Agent 5: Canvas + Settings
**Scope:** Canvas pane, settings panel, selectors
**Files:**
- `src/canvas/CanvasPane.tsx`
- `src/canvas/CanvasTabs.tsx`
- `src/canvas/CanvasEditor.tsx`
- `src/components/settings/SettingsPanel.tsx`
- `src/components/ModelSelector.tsx`
- `src/components/ThinkingSelector.tsx`

**Requirements:**
- Canvas: Warm elevated surface, subtle borders
- Canvas tabs: Ink-700 background, pill-shaped active state
- DiffRenderer: Aurora tint on syntax (not sharp red/green)
- Settings panel: Refine tab pills, hairline border
- Selectors: Pill-shaped dropdowns

---

## Animation Specifications

### Sidebar
```
Initial: width: 0, opacity: 0
Animate: width: 260, opacity: 1
Duration: 250ms
Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — spring
```

### Tab Indicator (Settings)
```
layoutId for smooth pill movement
Stiffness: 400, Damping: 30
```

### Message Entrance
```
Initial: opacity: 0, y: 8
Animate: opacity: 1, y: 0
Duration: 250ms
Easing: ease-out
```

### Aurora Orbs
```
Drift animation: 20s infinite alternate
Glow pulse: 4s infinite ease-in-out
```

---

## Component Acceptance Criteria

1. **No zinc-* utility classes remain** — all colors via CSS variables
2. **No saturated violet** — use aurora-lavender instead
3. **Pill-shaped buttons only** — radius 9999px
4. **Hairline borders** — 1px subtle, not heavy
5. **Typography follows scale** — negative tracking on display sizes
6. **Animations use spring/easeOut** — no linear transitions
