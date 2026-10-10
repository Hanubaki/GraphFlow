---
name: GraphFlow
description: Interactive distributed systems modeler with a live, client-side traffic simulation.
colors:
  control-room-black: "#090d16"
  panel-slate: "#0f172a"
  raised-slate: "#1e293b"
  hairline-slate: "#334155"
  text-bright: "#f1f5f9"
  text-body: "#e2e8f0"
  text-secondary: "#cbd5e1"
  text-muted: "#94a3b8"
  signal-cyan: "#22d3ee"
  signal-cyan-solid: "#06b6d4"
  signal-cyan-deep: "#0891b2"
  status-healthy: "#34d399"
  status-degraded: "#fbbf24"
  status-error: "#fb7185"
  data-violet: "#8b5cf6"
  data-purple: "#a855f7"
  data-indigo: "#818cf8"
  data-indigo-deep: "#6366f1"
  data-sky: "#38bdf8"
  data-ocean: "#0ea5e9"
  data-blue: "#3b82f6"
  data-teal: "#14b8a6"
  data-emerald: "#10b981"
  data-amber: "#f59e0b"
  data-orange: "#f97316"
  data-rose: "#f43f5e"
  data-red: "#ef4444"
  data-pink: "#ec4899"
  inverse-light: "#f1f5f9"
  inverse-ink: "#020617"
typography:
  display:
    fontFamily: "IBM Plex Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-cyan-solid}"
    textColor: "{colors.inverse-ink}"
    rounded: "{rounded.xl}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.signal-cyan}"
  button-pro:
    backgroundColor: "{colors.inverse-light}"
    textColor: "{colors.inverse-ink}"
    rounded: "{rounded.xl}"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.xl}"
    padding: "0 24px"
    height: "44px"
  button-toolbar:
    backgroundColor: "{colors.raised-slate}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    height: "32px"
  card:
    backgroundColor: "{colors.panel-slate}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  modal:
    backgroundColor: "{colors.panel-slate}"
    rounded: "{rounded.2xl}"
  input:
    backgroundColor: "{colors.control-room-black}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: "8px"
  canvas-node:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.xl}"
---

# Design System: GraphFlow

## Overview

**Creative North Star: "The Control Room"**

GraphFlow is a dark, calm operations room. Most of the screen is quiet: near-black floors, slate panels, hairline borders, and low-contrast chrome. Color shows up only when the system has something to say. Cyan means "you can act here" or "this is selected". Emerald, amber, and rose report health, degradation, and failure. Anything colored without a reason is noise.

The mood is calm, precise, and technical. Chrome stays in the background and attention goes to the canvas, where live packets move along bezier edges. The interface is dense where engineers need data (inspector, telemetry, node metrics) and open where they need focus (the canvas). It is a tool for people who read latency numbers for a living, so it never decorates and never shouts.

Confirmed rejections: gradient text, decorative blur orbs, glow halos on chrome, eyebrow/kicker labels, rainbow icon tiles, hero-metric banners, and monospace used as costume.

**Key Characteristics:**
- A single accent (Signal Cyan) for action and selection, used on a small fraction of any screen.
- Status colors reserved strictly for system state.
- Depth comes from tonal layering and hairline borders, not shadows.
- IBM Plex Sans for interface text; IBM Plex Mono only for real data (metrics, code, IDs).
- Dense, legible, keyboard-first controls.

## Colors

A near-black, cool slate world with one signal color and three status colors.

### Primary
- **Signal Cyan** (#22d3ee): Selection, focus rings, active tabs, links, and accent text. The interface's only "look here" color.
- **Signal Cyan Solid** (#06b6d4): Fill for the primary call to action (with Inverse Ink text).
- **Signal Cyan Deep** (#0891b2): Fill for the in-app primary toolbar action (Export).

### Neutral
- **Control Room Black** (#090d16): Page and canvas floor. Token `dark-950`.
- **Panel Slate** (#0f172a): Panels, cards, modals, canvas nodes. Token `dark-900`.
- **Raised Slate** (#1e293b): Default borders (`border-slate-800`), hover fills, raised controls.
- **Hairline Slate** (#334155): Stronger borders on secondary buttons and inputs on hover.
- **Text Bright** (#f1f5f9): Headings and primary values.
- **Text Body** (#e2e8f0) / **Text Secondary** (#cbd5e1): Body copy and control labels.
- **Text Muted** (#94a3b8): Metadata and helper text. This is the lowest text contrast allowed on Control Room Black.
- **Inverse Light** (#f1f5f9) / **Inverse Ink** (#020617): The inverted Pro button and the ink on cyan fills.

### Status (semantic only)
- **Status Healthy** (#34d399): Running simulation, healthy nodes, success checks.
- **Status Degraded** (#fbbf24): Chaos, latency degradation, warnings.
- **Status Error** (#fb7185): Failed packets, errors, destructive actions.

### Data (semantic only)
- **Data Violet** (#8b5cf6): gRPC protocol edges and multiplayer peer cursors.
- **Node Category Palette** (`data-*` tokens: sky, ocean, blue, indigo, purple, teal, emerald, amber, orange, rose, red, pink): One hue per node category (client, gateway, service, queue, database, cache, external, and so on), defined in `src/constants/nodeCatalog.ts` and reused by templates and the AI generator. These colors identify *what a node is* and appear only on canvas nodes, edges, the palette icons, and exports. They never appear in chrome, buttons, or marketing surfaces.

### Named Rules
**The One Signal Rule.** Signal Cyan is the only accent. No cyan-to-blue gradients, no second brand color. If two things on screen are cyan, they must both be actionable or selected.

**The Status Is Sacred Rule.** Emerald, amber, and rose mean healthy, degraded, and error, and nothing else. Never use them for decoration, feature icons, or marketing emphasis.

**The Muted Floor Rule.** No text or placeholder below Text Muted (#94a3b8) on dark surfaces. `slate-500`/`slate-600` fail WCAG AA here.

## Typography

**Display Font:** IBM Plex Sans (with system-ui, -apple-system, Segoe UI)
**Body Font:** IBM Plex Sans
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, SFMono-Regular, Menlo)

**Character:** Plex Sans is an engineered grotesque with a calm, technical voice. Plex Mono is its native companion for numbers and code, and the pairing reads like well-written documentation.

### Hierarchy
- **Display** (700, clamp 36–60px, 1.1): The landing hero headline only.
- **Headline** (700, 30px, 1.2): Landing section headings and the pricing modal title.
- **Title** (700, 16px, 1.4): Modal titles, card headings, inspector section headings.
- **Body** (400, 14px, 1.6): Running copy on the landing page and in modal descriptions. Max line length about 65ch.
- **Label** (600, 12px, 1.4): Control labels, buttons, tabs, form labels.
- **Data** (Plex Mono 500, 11px, 1.4, tabular numerals): Metrics (RPS, latency, error rate), IDs, code. This is the smallest size allowed.

### Named Rules
**The Four Step Rule.** Interface type uses four steps: 11 (data), 12 (label), 14 (body), 16+ (title). Never go below 11px, and don't invent in-between sizes such as 9px or 10px. Hierarchy comes from size first, weight second, and color last.

**The Real Data Rule.** Plex Mono appears only where the content is actually data or code. Uppercase mono labels such as "LATENCY:" used as decoration are costume.

## Layout

The app is a full-viewport shell: a top bar (48–56px), a collapsible node palette on the left (`w-72`, collapsed `w-14`), an infinite canvas in the center, and a contextual inspector on the right (`w-80`). The canvas always gets the most space, and the panels serve it.

Spacing follows Tailwind's 4px base. Controls use 8–12px internal gaps, panels use 12–16px padding, and cards and modals use 24px. Landing sections use `py-20` with a `max-w-5xl` container and centered headings.

Breakpoints are Tailwind defaults (`sm` 640, `md` 768, `lg` 1024). Below `md`, the palette starts collapsed and the inspector becomes an overlay or sheet. The canvas must never be squeezed by two fixed panels on a phone.

## Elevation & Depth

Depth comes from tonal layering. Control Room Black is the floor, Panel Slate is the surface, and Raised Slate is used for hover and raised controls, all separated by 1px hairline borders. Shadows are reserved for real elevation: elements that float above the canvas or page (modals, dropdowns, overlays).

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)`, Tailwind `shadow-2xl`): Modals and the landing demo frame.
- **Scrim** (`background: rgba(0,0,0,0.7)` plus `backdrop-filter: blur(4px)`): Behind modals.
- **Canvas Status Glow** (`box-shadow: 0 0 Npx <status color>`): Only on canvas nodes and edges, to signal selection, error, or chaos state.

### Named Rules
**The Glow Means State Rule.** A glow is a status signal on the canvas, never decoration. Logos, toolbars, pills, and landing elements get no glow.

## Shapes

Rounded but not soft. Controls use 8px (`rounded-lg`), primary landing buttons and canvas nodes use 12px (`rounded-xl`), and cards and modals use 16px (`rounded-2xl`). Status dots, avatars, and peer cursors are fully round. Borders are always 1px hairlines; 2px is reserved for the featured pricing card.

## Components

### Buttons
Precise and quiet: clear edges, one primary per view, flat color transitions.
- **Shape:** 12px on landing (`rounded-xl`), 8px in the app toolbar (`rounded-lg`).
- **Primary:** Signal Cyan Solid fill with Inverse Ink text, 44px tall on landing. In the app, the Export action uses Signal Cyan Deep with white text, 32px.
- **Pro:** Inverted. Inverse Light fill with Inverse Ink text, so the paid action is distinct from the free primary action.
- **Secondary:** Panel Slate fill, 1px Hairline Slate border, Text Body label.
- **Hover / Focus:** Color shift only (`transition-colors`); no scale, no lift. Focus uses `focus-visible:ring-2 ring-cyan-400`.
- **Toolbar icon buttons:** 28px visual size. On coarse pointers the hit area must reach 44px.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Panel Slate at 60–100% opacity over Control Room Black.
- **Shadow Strategy:** None at rest (see Elevation).
- **Border:** 1px Raised Slate; Hairline Slate on hover.
- **Internal Padding:** 24px.

### Inputs / Fields
- **Style:** Control Room Black fill, 1px Raised Slate border, 8px radius, 8px padding, 12px text.
- **Focus:** Border shifts to Signal Cyan; no glow.
- **Placeholder:** Text Muted or brighter (see The Muted Floor Rule).

### Modals
- **Shell:** Panel Slate, 1px Raised Slate border, 16px radius, Overlay shadow, `max-h-[85vh]`, over a Scrim.
- **Semantics:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at a Title-size heading.

### Navigation
- **Landing nav:** Sticky, 64px, Panel Slate at 80% with backdrop blur and a hairline bottom border. Links are 12px Text Muted and turn Text Bright on hover. One primary CTA.
- **App top bar:** Dense, with label-size controls grouped by function. Telemetry pill on the left, primary Export on the right.

### Canvas Node (signature component)
A Panel Slate card with a 12px radius, a 6px colored category strip on top, an icon tile, a name, and metrics (latency, RPS) in Data type. Its state is shown by border color and a status glow (selected = Signal Cyan, degraded = Status Degraded, failing = Status Error). Nodes are keyboard-focusable and draggable via touch.

## Do's and Don'ts

### Do:
- **Do** keep Signal Cyan for action, selection, and focus only.
- **Do** use the four type steps (11/12/14/16+) and Plex Mono only for real data.
- **Do** build depth with Panel Slate on Control Room Black and 1px borders.
- **Do** give every modal dialog semantics and every control a visible `focus-visible` ring.
- **Do** keep the canvas the largest surface at every breakpoint.

### Don't:
- **Don't** use cyan-to-blue (or any) gradients on logos, buttons, or text.
- **Don't** add decorative blur orbs, glow halos on chrome, or `hover:scale` effects.
- **Don't** use emerald, amber, rose, or violet for decoration or feature icons.
- **Don't** use eyebrow labels, hero-metric banners, or same-size icon-card grids.
- **Don't** set text below 11px, or placeholders darker than Text Muted.
