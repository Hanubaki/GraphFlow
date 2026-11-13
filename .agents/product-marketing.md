# Product Marketing Context

**Document version:** v3
**Last updated:** 2026-11-11

Drafted from PRODUCT.md, README.md and the landing page. Items marked TODO need the owner's input. Nothing here is invented: no testimonials, customers or numbers exist yet.

## Product Overview
**One-liner:** GraphFlow is a system design diagram that runs: draw an architecture, push simulated traffic through it, and watch where it breaks.
**What it does:** Browser-based distributed systems modeler with a live client-side simulation. You compose services, queues, caches and databases, inject traffic surges and faults, and read latency, saturation, circuit breaker trips and dead-letter routing in real time. Results share as links and embeds, or export as Mermaid, SVG/PNG, Docker Compose, Terraform, Kubernetes and k6.
**Product category:** System design simulator / architecture diagram tool.
**Product type:** SaaS, free to try with no sign-in.
**Business model:** Free ($0, up to 3 saved projects), Pro Developer ($12/month or $9/month billed annually at $99, unlimited projects, AI generation, Terraform export, collaboration), Engineering Team ($39/month or $32/month annual, up to 10 seats, contact by email). Pro checkout is live on Lemon Squeezy (confirmed by the owner 2026-11-11). Paying customers so far: unknown, TODO.

## Target Audience
**Target companies:** Teams that run distributed systems. Company size and industry: TODO.
**Decision-makers:** Backend and platform engineers, staff engineers and tech leads who own the design.
**Primary use case:** Find out where a design breaks before it reaches production, and show the team.
**Jobs to be done:**
- Prepare for a design review with evidence, not boxes and arrows.
- Explain an incident or capacity risk to the team.
- Turn a diagram into infrastructure code (Compose, Terraform, k6).
**Use cases:**
- Design review or RFC.
- Incident retrospective.
- Capacity planning before a launch.
- System design interview practice (added as a target 2026-11-13): candidates break the classic questions (URL shortener, news feed, chat, rate limiter, Uber) instead of only drawing them. Runnable presets at `/#interview`; outreach plan in `marketing/interview-outreach.md`.
Secondary, not confirmed as targets: educators.

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Platform / backend engineer | Speed, accuracy, no hype | Static diagrams hide bottlenecks | See the failure happen in seconds |
| Tech lead / staff engineer | Convincing the team | Hard to justify a design change | A link the team can open and run |

## Problems & Pain Points
**Core problem:** Architecture diagrams are inert. Nobody sees the queue back up or the dependency drag everything down until production.
**Why alternatives fall short:**
- draw.io, Lucidchart, Excalidraw, Miro: static boxes, no behavior.
- Load testing real systems: slow, costly, needs a built environment.
**What it costs them:** Incidents, over-provisioning, long design debates without evidence.
**Emotional tension:** Fear of the failure nobody modeled.

## Competitive Landscape
**Direct:** Few browser tools simulate topologies live. TODO: research current ones.
**Adjacent (seen 2026-11-11):** Diagrm (diagrm.com), per its cofounder's own r/devops comment: model an AWS architecture, enter expected workloads, estimate costs and spot design issues before deploying; public beta, offering free pilots to teams. Focus is cost and AWS, not live failure behavior. Not verified beyond that comment.
**Secondary:** draw.io, Lucidchart, Excalidraw, Miro, Mermaid: draw only, no simulation.
**Indirect:** Spreadsheets, whiteboard back-of-envelope math, load tests (k6, Locust) on real systems.

## Differentiation
**Key differentiators:**
- Live simulation along every edge: per-node latency, failure probability, capacity.
- Chaos and surge injection per node.
- Runs in the browser, no install, no sign-in to try.
- Source-available (PolyForm Noncommercial 1.0.0, not OSI open source).
**How we do it differently:** The diagram is the model. Edit it and re-run.
**Why that's better:** Bottlenecks and cascading failures become visible the moment they happen.
**Why customers choose us:** TODO, no customer evidence yet.

## Objections
| Objection | Response |
|-----------|----------|
| "It is a toy, not my real system." | TODO: state what the model does and does not capture, truthfully. |
| "I already have draw.io." | Keep it. Import the diagram and run it. |
| "Noncommercial license." | TODO: clarify what commercial use requires. |

**Anti-persona:** Anyone who needs a pixel-perfect presentation diagram with no behavior.

## Switching Dynamics
**Push:** Static diagrams that cannot answer "what happens at 10x traffic".
**Pull:** Seeing a queue back up in real time, shareable link, export to Terraform.
**Habit:** Existing diagram tools and old files.
**Anxiety:** Model accuracy, vendor longevity, license terms.

## Customer Language
TODO: no interviews yet. Collect verbatim phrases from the first users.
**Words to use:** topology, nodes, edges, packets, chaos, surge, p99, backpressure, circuit breaker, DLQ.
**Words to avoid:** "revolutionary", "AI-powered" as the headline, "open source" (it is source-available).
**Glossary:**
| Term | Meaning |
|------|---------|
| Surge | Temporary traffic spike injected into the simulation |
| Chaos | Per-node fault injection |
| DLQ | Dead-letter queue for failed messages |

## Brand Voice
| Attribute | Means | Doesn't mean | Example line |
|-----------|-------|--------------|--------------|
| Direct | Say the point first | Curt | "The diagram runs." |
| Technical | Precise engineering vocabulary | Jargon for show | "p95/p99 latency, backpressure, circuit breakers" |
| Honest | Only verifiable claims | Modest to a fault | "Source-available, not open source." |

**Tone by context:** errors are plain and light (see the 404 page); launches are factual with a demo, never hype.
**Terms we own:** "the diagram runs".
**Never use:** numeric claims without measurement; testimonials or logos we do not have.

## Proof Points
**Metrics:** None published. The "60 FPS", "< 75 KB" and "0 canvas dependencies" claims have no benchmark yet. Measure before leaning on them.
**Customers:** None.
**Testimonials:** None.
**Value themes:**
| Theme | Proof |
|-------|-------|
| See failures live | The simulation itself, demonstrable in any template |
| Shareable | Link, embed and export features |

## Goals
**Business goal:** Paying customers (owner, 2026-11-11). The owner can put in a large share of their time each week.
**Conversion action:** Open the studio and run a template, then hit the 3-project limit or a Pro feature (AI, Terraform export) and upgrade to Pro.
**Current metrics:** Funnel events exist in the app (Session Started, Studio Engaged); no numbers recorded here yet.

## Learnings
*Decisions and tested lessons. Newest first.*
| Date | Learning | Evidence | Applies to | Status |
|------|----------|----------|------------|--------|
| | | | | |

## Changelog
- v3 (2026-11-11) — Added Diagrm as an adjacent competitor spotted in the r/devops thread.
- v2 (2026-11-11) — Goal set to paying customers; recorded real pricing and that Pro checkout is live.
- v1 (2026-11-11) — Initial context auto-drafted from PRODUCT.md, README and landing page.
