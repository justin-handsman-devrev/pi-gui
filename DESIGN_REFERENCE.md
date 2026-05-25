# π GUI Visual Reference — ElevenLabs-Inspired Dark Editorial

## Color Palette (Warm Inks)

| Token | Hex | Usage |
|-------|-----|-------|
| **Canvas Primary** | `#0c0a09` | Main app background |
| **Canvas Surface** | `#131210` | Panels, inputs |
| **Canvas Elevated** | `#1c1917` | Cards, sidebar |
| **Ink 700** | `#44403c` | Hover states |
| **Ink 600** | `#57534e` | Hairlines |
| **Ink 500** | `#78716c` | Muted text |
| **Text Primary** | `#fafaf9` | Headings |
| **Text Secondary** | `#a8a29e` | Body text |

## Aurora Accents (Soft Glows)

| Token | Hex | Usage |
|-------|-----|-------|
| **Lavender** | `#9d8bb8` | Primary accent, focus rings |
| **Mint** | `#5fb8a3` | Success, toggle on |
| **Peach** | `#d4a88c` | Warning, streaming |
| **Rose** | `#c494a4` | Error, deletions |
| **Sky** | `#7da8c8` | Secondary accent |

## Geometric Principles

### Pill Shape (Primary CTA)
```
border-radius: 9999px
background: #292524 (ink)
height: 40px
padding: 10px 20px
hover: #44403c
active: scale(0.98)
```

### Hairline Borders
```css
border: 1px solid rgba(255,255,255,0.06)
```

### Typography Scale

| Scale | Size | Tracking | Usage |
|-------|------|----------|-------|
| **Mega** | 48px | -1.44px | π logo |
| **XL** | 36px | -0.72px | Hero text |
| **LG** | 28px | -0.28px | Section titles |
| **MD** | 20px | 0 | Card headers |
| **Body** | 15px | +0.15px | Default text |
| **Caption** | 13px | 0 | Secondary info |
| **Label** | 11px | +0.88px | Uppercase badges |

## Component Examples

### Primary Button
```
┌──────────────────────────────┐
│     ●  New Chat              │  ← 9999px radius
└──────────────────────────────┘
     #292524 bg, white text
```

### Ghost Button
```
┌──────────────────────────────┐
│       Settings               │  ← transparent, hairline
└──────────────────────────────┘
     hover: #44403c/30
```

### Text Input (Pill)
```
┌────────────────────────────────────────────┐
│   Enter your message...               ⏎  │  ← #131210 bg
└────────────────────────────────────────────┘
     focus: aurora-lavender ring
```

### Aurora Orb (Atmospheric)
```
     ╭──────────────────╮
   ╭─│                  │─╮
  │  │   soft glow      │  │  ← blur(60px)
  │  │   #9d8bb8/0.08   │  │     opacity 8%
  │  │                  │  │
   ╰─│                  │─╯
     ╰──────────────────╯
        animation: drift 20s
```

### Code Block
```
┌──────────────────────────────────────────┐
│ typescript                    Copy       │  ← #1c1917 bg
├──────────────────────────────────────────┤
│ const example = "aurora";                │  ← #0c0a09 bg
│ console.log(example);                    │     syntax: aurora
└──────────────────────────────────────────┘
```

### Message Bubble (User)
```
                         ┌────────────────────────┐
                         │                        │  ← #44403c
                         │  User message here     │     rounded-2xl
                         │                        │
                         └────────────────────────┘
```

### Message Bubble (Assistant)
```
 ┌───┐ ┌──────────────────────────────────────────┐
 │ π │ │                                          │  ← transparent
 └───┘ │  Assistant response with code blocks     │     on canvas
       │  and inline `code`                     │
       └──────────────────────────────────────────┘
```

## Animation Specification

### Sidebar Slide
```
initial: { x: -260, opacity: 0 }
animate: { x: 0, opacity: 1 }
transition: { type: "spring", stiffness: 300, damping: 30 }
```

### Message Enter
```
initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.25, ease: "easeOut" }
```

### Aurora Drift
```
@keyframes drift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(20px, -15px); }
}
animation: drift 20s ease-in-out infinite alternate
```

## Comparison: Before → After

| Before | After |
|--------|-------|
| `bg-zinc-950` `#09090b` | `bg-[#0c0a09]` warm near-black |
| `violet-500` `#8b5cf6` | `aurora-lavender` `#9d8bb8` |
| `rounded-lg` 8px | `rounded-full` 9999px (pills) |
| `border-zinc-800` | `border-white/[0.06]` hairline |
| Sharp corners | Round everything |
| Saturated accents | Soft aurora glows |
| Cold grays | Warm inks |

## Key Principles

1. **Pill geometry** for all CTAs and inputs
2. **Hairlines** not heavy borders
3. **Solid ink** not gradients
4. **Aurora accents** for atmosphere
5. **Negative tracking** on display
6. **Warm near-blacks** not cold zincs