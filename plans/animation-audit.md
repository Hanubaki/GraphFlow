# Animation audit (2026-11-11)

Scope: all interactive UI under `src/`, standard effort, read-only. Method: Emil Kowalski's `improve-animations` rules (AUDIT.md), every finding re-read at file:line and checked against the built CSS. Feel was not judged on a real device.

Stack: React + Tailwind v3 (`plugins: []`), no animation library, motion is CSS classes and SVG. Reduced motion is handled in `src/index.css:114-144`.

## Findings, ordered by leverage

| # | Severity | Category | Location | Finding | Fix summary |
|---|---|---|---|---|---|
| 1 | HIGH | Purpose / physicality | 9 modals (`AuthModal:137`, `AiGeneratorModal:155`, `EmbedModal:53`, `ExportModal:137`, `LegalComplianceModal:59`, `TemplatesModal:39`, `PricingModal:88`, `ProjectsModal:163`, `LiveTelemetryModal:113`), backdrops (`AnalyticsModal:67`, `CommandPaletteModal:283`), `PeerCursorLayer:46` | `animate-in fade-in zoom-in-95`, `animate-fade-in`, `animate-fadeIn` have no CSS. No `tailwindcss-animate` (`plugins: []`, not in `package.json`) and the built CSS only has keyframes `dash`, `ping`, `pulse`, `spin`. Every modal appears instantly. | Define entrance motion once in `index.css`: modal opacity 0 to 1 and scale 0.96 to 1, 180 ms, `cubic-bezier(0.23, 1, 0.32, 1)`; backdrop fade 150 ms. No animation for the command palette (Ctrl+K is high frequency). |
| 2 | HIGH | Performance | 24 uses in 11 files (`TopBar`, `NodePalette`, `EmbedView`, `InspectorPanel`, `NodeComponent`, `OnboardingTour`, `ConnectionLine`, `AnalyticsModal`, `EmbedModal`, `ProjectsModal`, `TemplatesModal`) | `transition-all` animates every property, including layout and paint ones. | Replace with `transition-colors`, `transition-transform` or `transition-opacity`, whichever the element actually changes. |
| 3 | HIGH | Performance | `ConnectionLine.tsx:79-86` | Every edge carries a permanent `animate-flow-dash` overlay. It animates `stroke-dashoffset` on the main thread and repaints every wire each frame on desktop. `index.css:89` already says so and disables it only on touch. Cost grows with edge count. | Run it only while the simulation is running (`animation-play-state: paused` otherwise) and/or only on the selected edge. Packets already show flow. |
| 4 | MEDIUM | Performance | `NodePalette.tsx:75` | Collapse animates width (`w-14` and `w-72`) with `transition-all duration-300`, which reflows the canvas every frame, on an element with `backdrop-blur-xl`. | Slide the panel with `transform` over the canvas, or snap the width without animation. |
| 5 | MEDIUM | Purpose | `NodeComponent.tsx:428` (also `:331`) | Infinite `animate-pulse` on every node's output port has no state meaning. N nodes pulse forever. (Pulses that mean live streaming or error are fine.) | Remove the pulse, keep a static dot, highlight only while connecting. |
| 6 | MEDIUM | Performance | `GraphCanvas.tsx:505-512` | The in-progress connection path combines a dash animation with an 8 px `drop-shadow` filter on a path that changes on every pointer move. | Drop the filter (or the dash animation) while dragging. |
| 7 | LOW | Cohesion | repo-wide | No motion tokens. Easing and duration are Tailwind defaults plus one hand-typed `cubic-bezier(0.4, 0, 0.6, 1)`; durations mix 150, 200 and 300 ms. | Add `--ease-out` and `--duration-*` tokens in `index.css` and use them for #1. |
| 8 | LOW | Accessibility | `EmbedView:221`, `NodeComponent` ports and delete button | `hover:scale-*` and `group-hover:opacity-100` are not gated by `@media (hover: hover)`. Touch devices fire false hovers. | Gate with `@media (hover: hover) and (pointer: fine)`. Verify on a real phone first. |

## Status

- #1 fixed: `gf-modal-in` and `gf-fade-in` keyframes plus the `--ease-out` token in `index.css`; the command palette backdrop no longer animates.
- #2 fixed: all 24 `transition-all` replaced with the properties each element changes (colors, opacity, transform, width, tour position).
- #3 fixed: the edge dash overlay pauses when the simulation is paused (`data-sim` on the canvas SVG).
- #4 to #8 open.

## Missed opportunities

- Selecting a node swaps the right panel from "System Overview" to "Service Inspector" instantly. A 150 ms crossfade would explain the change.
- The floating node toolbar (Kill, +100ms, CB, 2x RPS) appears on selection with no motion. A short fade and rise from the node would tie it to its trigger.

## Already right

- Reduced motion is handled: movement drops, color and opacity transitions stay.
- No `scale(0)`, no `ease-in` on UI, durations stay at or under 300 ms.
- The utilization bar animates `transform` (`NodeComponent:402`).

## Not checked

- Real-device feel (phones, trackpads) and frame rates under a large graph.
- Marketing page motion (`LandingPage`, `LandingSections20`).
