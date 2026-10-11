---
name: GraphFlow
description: Interactive distributed systems modeler with a live, client-side traffic simulation.
colors:
  graphite-floor: "#08090a"
  graphite-panel: "#0f1012"
  graphite-raised: "#1c1d21"
  graphite-border: "#24262a"
  graphite-hairline: "#35373c"
  text-bright: "#f7f8f8"
  text-body: "#e1e3e6"
  text-secondary: "#c8cbd0"
  text-muted: "#9a9ea6"
  text-statement: "#6f737b"
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
  inverse-light: "#f7f8f8"
  inverse-ink: "#08090a"
typography:
  display:
    fontFamily: "Mona Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "4.75rem"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  display-mobile:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  statement:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  lead:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.625
  title:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Mona Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Mona Sans, system-ui, sans-serif"
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
    backgroundColor: "{colors.inverse-light}"
    textColor: "{colors.inverse-ink}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.text-body}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-app-export:
    backgroundColor: "{colors.signal-cyan-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    height: "32px"
  button-toolbar:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    height: "32px"
  card:
    backgroundColor: "{colors.graphite-panel}"
    rounded: "{rounded.xl}"
    padding: "24px"
  modal:
    backgroundColor: "{colors.graphite-panel}"
    rounded: "{rounded.2xl}"
  input:
    backgroundColor: "{colors.graphite-floor}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: "8px"
  canvas-node:
    backgroundColor: "{colors.graphite-panel}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.lg}"
---

# Design System: GraphFlow

## Overview

**Creative North Star: "The Control Room"**

GraphFlow is a dark, calm operations room. Most of the screen is quiet: neutral graphite floors, near-black panels, hairline borders, and low-contrast chrome. Color shows up only when the system has something to say. Cyan means "this is selected" or "this is GraphFlow". Emerald, amber, and rose report health, degradation, and failure. Anything colored without a reason is noise.

The mood is calm, precise, and technical. Chrome stays in the background and attention goes to the canvas, where live packets move along bezier edges. The interface is dense where engineers need data (inspector, telemetry, node metrics) and open where they need focus (the canvas). It is a tool for people who read latency numbers for a living, so it never decorates and never shouts.

The landing page was rebuilt against Railway, Linear, and Resend as references: neutral near-black, almost no accent color, a display face with character, the real product window as the hero, and left-aligned sections with a wide artifact under each heading.

Confirmed rejections: navy/blue-tinted slate, gradient text, decorative blur orbs, glow halos on chrome, eyebrow/kicker labels, rainbow icon tiles, same-size icon-card grids, hero-metric banners, centered-everything layouts, and monospace used as costume.

**Key Characteristics:**
- Neutral graphite, not navy. The `slate` scale in `tailwind.config.js` is overridden with neutral greys, so the app and landing share one palette.
- White is the primary action color on marketing surfaces. Signal Cyan is for selection, focus, and the brand mark.
- Status colors reserved strictly for system state.
- Depth comes from tonal layering and hairline borders, not shadows.
- Mona Sans for interface and display text; IBM Plex Mono only for real data (metrics, code, IDs).
- Dense, legible, keyboard-first controls.

## Colors

A neutral graphite world with one signal color and three status colors.

### Primary
- **Inverse Light** (#f7f8f8) on **Inverse Ink** (#08090a): The primary call to action on the landing page and the Pro upgrade button.
- **Signal Cyan** (#22d3ee): Selection (the selected demo node ring), focus rings, active tabs, and in-app accents.
- **Signal Cyan Solid** (#06b6d4): The brand mark tile.
- **Signal Cyan Deep** (#0891b2): Fill for the in-app primary toolbar action (Export).

### Neutral
- **Graphite Floor** (#08090a): Page and canvas floor. Token `dark-950`, also `body` background and `theme-color`.
- **Graphite Panel** (#0f1012): Panels, cards, modals, canvas nodes. Token `dark-900`.
- **Graphite Raised** (#1c1d21): Hover fills, raised controls. Token `dark-800`.
- **Graphite Border** (#24262a): Default borders (`border-slate-800`) and the 1px gap lines in `gap-px` grids.
- **Graphite Hairline** (#35373c): Stronger borders on secondary buttons, demo edges.
- **Text Bright** (#f7f8f8): Headings and primary values.
- **Text Body** (#e1e3e6) / **Text Secondary** (#c8cbd0): Body copy and control labels.
- **Text Muted** (#9a9ea6): Metadata and helper text. This is the lowest contrast allowed for small text.
- **Text Statement** (#6f737b): Only for the second tone of large two-tone statements (24px and up), where it passes the 3:1 large-text threshold.

### Status (semantic only)
- **Status Healthy** (#34d399): Running simulation, healthy nodes, success checks.
- **Status Degraded** (#fbbf24): Chaos, latency degradation, surge, warnings.
- **Status Error** (#fb7185): Failed packets, errors, destructive actions.

### Data (semantic only)
- **Data Violet** (#8b5cf6): gRPC protocol edges and multiplayer peer cursors.
- **Node Category Palette** (`data-*` tokens: sky, ocean, blue, indigo, purple, teal, emerald, amber, orange, rose, red, pink): One hue per node category (client, gateway, service, queue, database, cache, external, and so on), defined in `src/constants/nodeCatalog.ts` and reused by templates and the AI generator. These colors identify *what a node is* and appear only on canvas nodes, edges, the palette icons, and exports. They never appear in chrome, buttons, or marketing copy.

### Named Rules
**The One Signal Rule.** Signal Cyan is the only accent. No cyan-to-blue gradients, no second brand color. If two things on screen are cyan, they must both be selected, focused, or the brand mark.

**The White Primary Rule.** On marketing surfaces the primary button is white with ink text. There is one primary per view.

**The Status Is Sacred Rule.** Emerald, amber, and rose mean healthy, degraded, and error, and nothing else. Never use them for decoration, feature icons, or marketing emphasis.

**The Muted Floor Rule.** No small text or placeholder below Text Muted (#9a9ea6) on dark surfaces. `slate-500` is allowed only as the statement tone at 24px or larger; `slate-600` never carries text.

## Typography

**Display Font:** Mona Sans (variable, `wdth` 100–125, `wght` 400–700; with system-ui, -apple-system, Segoe UI)
**Body Font:** Mona Sans
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, SFMono-Regular, Menlo)

**Character:** Mona Sans is a grotesque with a width axis. Display text runs at weight 600, `font-stretch: 112%`, and tight tracking (-0.035em), which gives headings their own voice without a decorative face. Plex Mono stays as the companion for numbers and code, so the data reads like well-written documentation.

### Hierarchy
- **Display** (600, 44px mobile → 76px desktop, 1.02, -0.035em, wide): The landing hero and closing headlines only.
- **Statement** (500, 28px → 40px, 1.15): The two-tone statement paragraph. First sentence Text Bright, the rest Text Statement.
- **Headline** (600, 24px → 28px, 1.2, wide): Landing section headings (h2/h3).
- **Lead** (400, 17px, 1.625): Hero subcopy and the paragraph beside each section heading. Max 46ch.
- **Title** (600, 15px, 1.4): Pricing tier names, modal titles, card headings, the wordmark.
- **Body** (400, 14–15px, 1.6): Running copy. Max line length about 65ch.
- **Small** (400, 13px, 1.5): Nav links, table cells, inspector rows, button labels on landing.
- **Label** (600, 12px, 1.4): App control labels, tabs, form labels, telemetry captions.
- **Data** (Plex Mono 500, 11–12px, tabular numerals): Metrics (RPS, latency, error rate), IDs, code. 11px is the smallest size allowed.

### Named Rules
**The Small Steps Rule.** Interface type uses the steps above. Never go below 11px, and don't invent in-between sizes such as 9px or 10px. Hierarchy comes from size first, weight second, and color last.

**The Real Data Rule.** Plex Mono appears only where the content is actually data or code. Uppercase mono labels such as "LATENCY:" used as decoration are costume.

## Layout

The app is a full-viewport shell: a top bar (48–56px), a collapsible node palette on the left (`w-72`, collapsed `w-14`), an infinite canvas in the center, and a contextual inspector on the right (`w-80`). The canvas always gets the most space, and the panels serve it.

Spacing follows Tailwind's 4px base. Controls use 8–12px internal gaps, panels use 12–16px padding, and cards and modals use 24px.

The landing page uses a `max-w-6xl` container, left-aligned throughout. Sections follow the Linear pattern: the heading on the left, the lead paragraph on the right (`md:grid-cols-2`), and a wide artifact below (the live demo, the fault table, the export viewer, the pricing grid). Sections are separated by generous vertical space (`py-24 md:py-32`, up to `md:py-40` for the statement) and single hairlines, not cards. Grids of related cells use `gap-px` on a border-colored background instead of individual bordered cards.

Breakpoints are Tailwind defaults (`sm` 640, `md` 768, `lg` 1024). Below `md`, the palette starts collapsed and the inspector becomes an overlay or sheet. The canvas must never be squeezed by two fixed panels on a phone. The landing demo canvas scales down to fit its container instead of scrolling horizontally.

## Elevation & Depth

Depth comes from tonal layering. Graphite Floor is the floor, Graphite Panel is the surface, and Graphite Raised is used for hover and raised controls, all separated by 1px hairline borders. Shadows are reserved for real elevation: elements that float above the canvas or page (modals, dropdowns, overlays, the hero product window).

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)`, Tailwind `shadow-2xl`): Modals.
- **Product Window** (`0 40px 120px -40px rgba(0,0,0,0.9)`): The landing hero studio frame only, over a soft grey floor light.
- **Scrim** (`background: rgba(0,0,0,0.7)` plus `backdrop-filter: blur(4px)`): Behind modals.
- **Canvas Status Glow** (`box-shadow: 0 0 Npx <status color>`): Only on canvas nodes and edges, to signal selection, error, or chaos state.

### Named Rules
**The Glow Means State Rule.** A glow is a status signal on the canvas, never decoration. Logos, toolbars, pills, and landing elements get no glow.

## Shapes

Rounded but not soft. Controls and landing buttons use 8px (`rounded-lg`), cards, the product window, and landing artifacts use 12px (`rounded-xl`), and modals use 16px (`rounded-2xl`). Status dots, avatars, and peer cursors are fully round. Borders are always 1px hairlines.

## Components

### Buttons
Precise and quiet: clear edges, one primary per view, flat color transitions.
- **Shape:** 8px (`rounded-lg`) everywhere.
- **Primary (landing):** Inverse Light fill with Inverse Ink text, 40px tall (32px in the nav).
- **Secondary (landing):** Transparent with a 1px Graphite Hairline border and Text Body label.
- **Pro:** Same white primary inside the Pro pricing cell, so the paid action is the only primary in that grid.
- **App Export:** Signal Cyan Deep with white text, 32px.
- **Hover / Focus:** Color shift only (`transition-colors`); no scale, no lift. Focus uses `focus-visible:ring-2 ring-cyan-400`.
- **Toolbar icon buttons:** 28px visual size. On coarse pointers the hit area must reach 44px.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Graphite Panel or Graphite Floor-adjacent `slate-950`.
- **Shadow Strategy:** None at rest (see Elevation).
- **Border:** 1px Graphite Border; Graphite Hairline on hover.
- **Internal Padding:** 20–24px.

### Code Viewer (landing)
Resend-style: a tab row, file name on the right, line numbers in Text Muted, comments in Text Muted, code in Text Body, 12px Plex Mono at 1.7 line height. Content is always real exporter output, never a mock.

### Inputs / Fields
- **Style:** Graphite Floor fill, 1px Graphite Border, 8px radius, 8px padding, 12px text.
- **Focus:** Border shifts to Signal Cyan; no glow.
- **Placeholder:** Text Muted or brighter (see The Muted Floor Rule).

### Modals
- **Shell:** Graphite Panel, 1px Graphite Border, 16px radius, Overlay shadow, `max-h-[85vh]`, over a Scrim.
- **Semantics:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at a Title-size heading.

### Navigation
- **Landing nav:** Sticky, 56px, Graphite Floor at 80% with backdrop blur and a hairline bottom border. Links are 13px Text Muted and turn Text Bright on hover. One white primary CTA ("Open studio").
- **App top bar:** Dense, with label-size controls grouped by function. Telemetry pill on the left, primary Export on the right.

### Canvas Node (signature component)
A Graphite Panel card with an 8px radius, a 3px colored category strip on top, an icon tile, a name, and metrics (latency, RPS) in Data type. Its state is shown by border color and a status glow (selected = Signal Cyan, degraded = Status Degraded, failing = Status Error). Nodes are keyboard-focusable and draggable via touch.

## Do's and Don'ts

### Do:
- **Do** keep Signal Cyan for selection, focus, and the brand mark; use white for the landing primary.
- **Do** show the real product (live demo, real exporter output, real share links) instead of illustrations.
- **Do** label anything that isn't live data ("Example run").
- **Do** build depth with Graphite Panel on Graphite Floor and 1px borders.
- **Do** give every modal dialog semantics and every control a visible `focus-visible` ring.
- **Do** keep the canvas the largest surface at every breakpoint.

### Don't:
- **Don't** reintroduce navy or blue-tinted slate.
- **Don't** use cyan-to-blue (or any) gradients on logos, buttons, or text.
- **Don't** add decorative blur orbs, glow halos on chrome, or `hover:scale` effects.
- **Don't** use emerald, amber, rose, or violet for decoration or feature icons.
- **Don't** use eyebrow labels, hero-metric banners, or same-size icon-card grids.
- **Don't** invent metrics or testimonials.
- **Don't** set text below 11px, or small text darker than Text Muted.
