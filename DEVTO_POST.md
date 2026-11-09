Every architecture review I've ever sat in goes roughly the same way. Someone opens Excalidraw or draw.io, draws a rectangle labeled `API`, draws an arrow to `Redis`, draws another arrow to `Postgres`, and everyone nods and says "looks solid, ship it."

Then two weeks later traffic spikes 3x, `Redis` is chilling at 2ms, `Postgres` is at 99% CPU dropping connections, and retries from the API gateway turn a minor slowdown into a full outage.

The problem with static diagrams is that a 2,500 RPS cache and a 400 RPS database look like the exact same box on a screen. Boxes don't have queues. Lines don't drop packets.

Over the past few weeks I've been building **[GraphFlow](https://graph-flow-virid.vercel.app)** to fix that. It's a source-available system design canvas where the diagram actually runs in your browser.

![GraphFlow live simulation](https://graph-flow-virid.vercel.app/graphflow-stripe-demo.gif)

If you want to skip the text and just poke at it, here is a live model of a Stripe-style webhook & double-entry ledger setup (no login or signup):

👉 **[Open the live Stripe Ledger simulation](https://graph-flow-virid.vercel.app/?template=stripe-webhook-ledger)**

Once it opens, try two things:
1. Grab the **Load** slider in the top bar and drag it from `1x` to `3.5x`. Watch the utilization bar under the Postgres node turn red while `p99` latency shoots up.
2. Click on any database or worker node and hit **Kill** (or **+100ms**) in the little floating bar above it. You'll see red 5xx packets back up until the upstream circuit breaker trips `OPEN` to stop the bleeding.

There's also a **[Netflix edge streaming chaos setup](https://graph-flow-virid.vercel.app/?template=netflix-chaos-streaming)** and a **[CQRS + Kafka Outbox template](https://graph-flow-virid.vercel.app/?template=resilient-cqrs-outbox)** if you want to play with different topologies.

---

### How the queuing math works (without melting the browser)

I didn't want the moving dots to just be eye candy. In GraphFlow, packets only spawn at actual ingress nodes (like a client, mobile app, or webhook source) and travel hop-by-hop. A downstream node doesn't emit a packet until an upstream packet actually reaches it.

Every node has a base latency, a max RPS capacity, and an error rate. When incoming traffic stays below ~70% of a node's capacity, latency stays flat. Once you cross 75% utilization, queuing backpressure kicks in and tail latency (`p95` / `p99`) curves upward fast:

```ts
const utilization = Math.min(1.5, arrivalRps / Math.max(1, node.throughputRps));
const queuingMultiplier =
  utilization > 0.75
    ? 1 + Math.pow((utilization - 0.75) / 0.25, 2) * 2.8
    : 1 + utilization * 0.25;
```

If a node has a circuit breaker enabled and hits 5 consecutive 5xx failures, it trips `OPEN` for 6 seconds, drops into `HALF-OPEN` to test the waters with a single request, and closes again if the downstream service recovered. You can also dial up packet loss (`0%` to `50%`) on individual wires to see what happens when the network between two healthy services gets flaky.

---

### Avoiding heavy canvas libraries (and the 2.5-Gigapixel mobile bug)

Initially I considered using PixiJS or Konva for the canvas, but I wanted crisp DOM text, normal CSS styling, and a tiny bundle. So the entire canvas is just standard React DOM nodes + native SVG cubic Bezier paths, evaluated via De Casteljau's formula inside a `requestAnimationFrame` loop.

To keep React from choking at 60 FPS, the simulation loop reads from mutable refs (`nodesRef` / `edgesRef`) and an `O(1)` lookup map instead of triggering full canvas re-renders on every tick.

That worked great on my desktop, until I opened the site on my phone last week and watched mobile Safari drop to about 4 FPS.

Turns out I had set the SVG canvas to `w-[50000px] h-[50000px]` so wires wouldn't clip when panning far out, and I had Tailwind `backdrop-blur` on the node cards. On mobile GPUs, a `50000 x 50000` element with blur filters forces the browser's tile compositor to allocate a **2.5-gigapixel texture buffer**.

Fixing it was a fun rabbit hole:
- Replaced the 50,000px SVG with a viewport-sized `w-full h-full overflow-visible` layer (`will-change-transform`) and disabled `backdrop-blur` on small screens (`md:backdrop-blur`).
- Added adaptive frame pacing on mobile (~33 FPS state commits while keeping `dt` packet speed identical) and throttled node queue counter updates to `4 Hz` (`240ms`) so React isn't diffing node cards 60 times a second.
- Added touch drag-to-connect and auto-framing so big topologies actually fit on a phone screen.

---

### Because drawing boxes by hand is tedious: Infra Import & Export

Nobody wants to manually drag 15 boxes onto a canvas during an incident review or before writing an RFC.

If you click **AI / Import -> Import Infra** in the top bar, you can paste an existing config file and it will reverse-engineer a 4-tier layout automatically:
- **`docker-compose.yml`** (reads your services, images like `postgres`/`redis`/`kafka`, and wires up `depends_on`)
- **`main.tf`** (parses Terraform AWS resources like ALB, ECS, RDS, ElastiCache, SQS, S3, Lambda)
- **`package.json`** (looks at dependencies like `pg`, `ioredis`, `kafkajs`, `stripe`, `@aws-sdk/client-s3` and builds your service graph)
- **OpenAPI 3.0 specs** or **CSV tables** (for mapping multi-department ERP flows)

There's also a **Live ERP/API** mode in the top bar where you can feed live JSON telemetry into the canvas instead of synthetic traffic.

Once you find your bottleneck—or use the **Pin Baseline** and **Auto-Harden** buttons in the right panel to add missing circuit breakers and scale up replicas—you can export the result straight into:
- **GitHub PR / Notion Mermaid diagrams** (`flowchart LR` + `sequenceDiagram` + an SLA & cloud cost summary table)
- **AWS / GCP / Azure monthly FinOps estimates** (so you can show your manager what adding Redis + 2 extra Fargate tasks actually costs vs. how much p99 latency it saves)
- **Terraform (`main.tf`)**, **Kubernetes (`k8s-manifests.yaml` with HPA)**, or a runnable **Grafana `k6` load test script**

---

### Give it a spin

The source is public and free to use for noncommercial purposes under PolyForm Noncommercial 1.0.0 (source-available, not OSI open source).

- **Live app:** [https://graph-flow-virid.vercel.app](https://graph-flow-virid.vercel.app)
- **GitHub repo:** [https://github.com/Hanubaki/GraphFlow](https://github.com/Hanubaki/GraphFlow)

If you work on backend systems or SRE, I'd genuinely love your feedback on the queuing model. Does the latency curve feel realistic when you push past 80% utilization, or are there specific failure modes (like DB connection pool starvation or retry storms) you'd want to simulate next?
