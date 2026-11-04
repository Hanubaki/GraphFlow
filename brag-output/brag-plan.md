# Brag Video Plan — GraphFlow (Changelog & Launch Update)

## 1. Inspection & Rubric Answers
1. **What is it (one sentence)?** An open-source, browser-based distributed systems simulator where architecture diagrams actually run with live queuing physics, chaos injection, and FinOps cost estimation.
2. **Who is it for, and what does it do for them?** Backend, SRE, and platform engineers who want to see where traffic spikes, fan-in saturation, and 5xx failures break their architecture before deploying.
3. **What sets it apart?** Unlike Excalidraw or draw.io, every node has RPS capacity, M/M/1 tail latency curves (`p95`/`p99`), and automatic circuit breakers (`OPEN -> HALF-OPEN -> CLOSED`) running at 60 FPS in pure SVG/DOM.
4. **What's the most impressive claim in this update?** We killed a 2.5-gigapixel (`50,000px × 50,000px`) mobile SVG GPU texture bottleneck, added 1-click reverse-engineering (`docker-compose.yml`, `main.tf`, `package.json`, `OpenAPI`, `ERP CSV`), and shipped a Live ERP/API Digital Twin telemetry stream.
5. **What's the visual hook?** Watching a static config (`docker-compose.yml` / `package.json`) snap into a live 4-tier topology with packets streaming across cubic Bezier wires and `Live: ON` telemetry pulsing.
6. **What real UI or flow should be shown?** The dark `#08090a` Control Room blueprint canvas, live node cards with `% Utilization` gauges, the `Live ERP/API` digital twin stream, the mobile viewport HUD (`1x/2x/5x Load`, `Fit`, `Inspect`), and `Pin Baseline` / `Auto-Harden` diagnostics.
7. **What tone fits?** `polished` with developer-honest engineering precision.
8. **Music cue guidance:**
   - Track: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM)
   - Beat locks: Scene 2 reveal at `3.27s`, Scene 3 mobile GPU fix at `8.74s`, Scene 4 FinOps/IaC cards on beat grid (`13.11s`, `14.20s`, `15.29s`), Scene 5 final logo payoff at `17.47s`.
9. **One-line share caption:** Shipped a massive update to GraphFlow: 1-click infra reverse-engineering (`docker-compose.yml` / `main.tf` / `package.json`), live ERP/API digital twin telemetry, and a mobile GPU fix that killed a 2.5-gigapixel SVG texture bottleneck.

---

## 2. Scene-by-Scene Storyboard (20.0s Total, 1280×720, 30 FPS)

### Scene 1 — Hook: Config to Live Topology (0.0s – 3.3s)
- **Visual:** Obsidian `#08090a` Control Room grid (`24px` cadence). Left terminal card shows `docker-compose.yml` / `main.tf` / `package.json` / `ERP.csv` morphing into a 4-tier auto-aligned DAG topology with glowing `#22d3ee` Bezier edges.
- **Text:**
  - Kicker: `GRAPHFLOW // OCTOBER UPDATE`
  - Headline: `Don't draw boxes by hand. Paste your stack and watch it run.`
- **SFX:** `interface/drop_001.ogg` at `0.2s`, `interface/click_002.ogg` at `1.6s`.

### Scene 2 — Live ERP / API Digital Twin Stream (3.3s – 8.7s) `// beat-locked: 3.27s`
- **Visual:** Real GraphFlow Studio UI. TopBar shows the emerald `● Live: ON (ERP/API Stream)` badge and `Load 3.5x` slider. Packets stream hop-by-hop from `Order Ingress` -> `SAP ERP Core` -> `WMS Inventory` & `Stripe Billing` -> `Analytics BI`. `Postgres Ledger` utilization bar crosses `94%` (red) as `p99` tail latency climbs from `48ms` to `340ms`, tripping the upstream Circuit Breaker (`OPEN`).
- **Text:**
  - Badge: `NEW // LIVE ERP & API DIGITAL TWIN TELEMETRY`
  - Caption: `Stream live JSON endpoints or stress-test at 3.5x load until circuit breakers trip.`
- **SFX:** `impact/impactSoft_medium_001.ogg` at `3.25s`, `interface/switch_004.ogg` at `5.34s`.

### Scene 3 — Killing the 2.5-Gigapixel Mobile GPU Bug (8.7s – 13.6s) `// beat-locked: 8.74s`
- **Visual:** Split engineering comparison + live mobile device viewport (`<768px`) showing auto-centered topology, touch drag-to-connect port hit-boxes, and the new floating Mobile HUD (`RPS: 420`, `LAT: 38ms`, `1x | 2x | 5x`, `Fit`, `Inspect`).
- **Text:**
  - Headline: `Killed the 2.5-Gigapixel Mobile SVG GPU Bottleneck`
  - Metric cards: `50,000px SVG -> Viewport Layer` • `4 Hz Queue Isolation` • `Touch Drag-to-Connect`
- **SFX:** `casino/card-slide-1.ogg` at `8.74s`, `interface/drop_002.ogg` at `10.93s`.

### Scene 4 — Pin Baseline, Multi-Cloud FinOps & PR Export (13.6s – 17.5s) `// beat-grid: 13.64s, 14.20s, 14.73s`
- **Visual:** Right-hand `Engineering Diagnostics` panel showing `Before / After Diff (Pin Baseline)`, `AWS $340/mo | GCP $310/mo | Azure $325/mo`, and 4 export cards snapping in on beat: `Mermaid (GitHub PR)`, `Terraform (main.tf)`, `Kubernetes HPA`, `Grafana k6`.
- **Text:**
  - Headline: `Prove the fix before opening the PR.`
- **SFX:** `interface/click_001.ogg` at `13.64s`, `casino/chip-lay-1.ogg` at `14.73s`.

### Scene 5 — Outro / Payoff (17.5s – 20.0s) `// beat-locked: 17.47s`
- **Visual:** Centered GraphFlow mark + live URL pill + MIT Open Source badge over animated schematic traces.
- **Text:**
  - Headline: `Stop drawing dead boxes. Run your architecture.`
  - CTA: `graph-flow-virid.vercel.app  •  github.com/Hanubaki/GraphFlow`
- **SFX:** `impact/impactBell_heavy_000.ogg` at `17.47s`.
