# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: backend and platform engineers who design or own distributed systems. They use GraphFlow to model an architecture, test how it behaves under traffic and failure, and share the result with their team (links, embeds, exports). Their situation is a design review, an incident retrospective, or an upcoming capacity change. They need answers fast, they are technically literate, and they distrust marketing language.

Secondary audiences (system design interview candidates, educators embedding diagrams in docs) are possible but not confirmed as targets. Do not design primarily for them.

## Product Purpose

GraphFlow is a browser-based distributed systems modeler with a live, client-side simulation engine. Users compose a topology on an infinite canvas, run simulated traffic through it, inject chaos, and watch saturation, latency compounding, circuit breaker trips, and dead-letter routing happen in real time.

Success means an engineer leaves with a better understanding of where their system breaks than a static diagram could give them, and a shareable artifact (link, embed, or infrastructure export) that carries that understanding to their team.

## Positioning

The diagram runs. Static tools (draw.io, Lucidchart, Excalidraw, Miro) draw inert boxes and lines. GraphFlow simulates packets along every edge, with per-node latency, failure probability, and capacity, so bottlenecks and cascading failures become visible the moment they happen. Live simulation is the core differentiator. Exports, AI generation, and templates are supporting features, not the headline.

## Operating Context

- Runs entirely in the browser (Vite + React SPA, deployed on Vercel). No install is needed to try it.
- Typical workflow: start from a template or AI prompt, edit nodes and edges, run the simulation, inject chaos or traffic surges, read telemetry (RPS, latency, error rate, dropped packets), then share or export.
- Sharing paths: URL hash share links, iframe embeds (for example in Notion), JSON, Markdown/Mermaid, Docker Compose, and Terraform export.
- Optional Supabase account for cloud-saved projects. Optional user-supplied Gemini API key for AI generation, with an offline rules engine as the fallback.
- Interface languages: English and Turkish.

## Capabilities and Constraints

- Canvas: native SVG, cubic bezier edges evaluated with De Casteljau, no third-party canvas runtime. Simulation tick runs on `requestAnimationFrame`, decoupled from React reconciliation.
- Simulation: packet lifecycle, per-node latency and failure probability, chaos injection, traffic surges, circuit breakers, retries, dead-letter queues, rolling telemetry.
- Editing: undo/redo history, keyboard navigation, touch pinch/pan, multiplayer presence.
- Tiers: Free and Pro (Lemon Squeezy checkout wired in code), with a Team tier described in pricing copy. The commercial launch state is not confirmed. Treat pricing as configured, not as proof of paying customers.
- Terminology: nodes, edges/connections, packets, topology, archetypes/templates, chaos, surge, DLQ, circuit breaker. Use engineering vocabulary precisely.
- Landing claims ("60 FPS", "< 75 KB", "0 canvas dependencies", open core) are considered technically accurate by the owner but have no published benchmark. Do not inflate them or add new numeric claims without measurement.

## Brand Commitments

- Name: GraphFlow. Open-source repository at github.com/Hanubaki/GraphFlow under the MIT license.
- Voice: direct, technical, precise. Write for engineers, without hype or filler.
- The existing visual system (recorded separately in DESIGN.md via `/impeccable document`) is the incumbent identity. Refinement preserves it.

## Evidence on Hand

- Real, working product: live deployment on Vercel and a public repository with passing CI.
- Real demonstrable assets: built-in architecture templates/archetypes, the live simulation itself, and export outputs.
- Absent, and not to be fabricated: user testimonials, customer logos, case studies, press mentions, usage numbers, revenue, published performance benchmarks.

## Product Principles

1. Show behavior, not boxes. Every surface should bring the live simulation forward. If a static tool could make the screen, it is not using GraphFlow's advantage.
2. Respect engineers' time. Get to a running topology in seconds, keep density high, and keep chrome quiet.
3. Truthful claims only. Every number and capability statement must be verifiable in the product or the code.
4. Shareable by default. A model only matters if it reaches the team, so share, embed, and export stay first-class paths.
5. Light and open. Runs in the browser with no install, keeps a small payload, and remains open core.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Keyboard-operable canvas and controls, live-region announcements for simulation and editing events, touch support for tablets, and full EN/TR localization. Respect reduced-motion preferences without killing the simulation's ability to communicate state.
