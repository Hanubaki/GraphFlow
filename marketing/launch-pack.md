# GraphFlow launch pack

Drafts for Show HN, Product Hunt, Reddit and social. Voice follows `.agents/product-marketing.md`: direct, technical, no hype, only claims that can be verified in the product.

Assets (generate with `python scripts/record-demo.py`, then convert with ffmpeg): `graphflow-launch-demo.mp4` (about 51 s, captioned), `graphflow-launch-demo-light.gif`, `public/og-image.png`.

Rules every post follows: say you are the author, say the license is source-available (PolyForm Noncommercial, not OSI open source), make no unmeasured numeric claims (no "60 FPS", no "75 KB"), say what the model is not.

---

## 1. Show HN

**Title:** `Show HN: GraphFlow – system design diagrams that run in your browser`

**URL:** `https://graph-flow-virid.vercel.app/`

**First comment (post it right after submitting):**

> Hi HN, I'm the author. I built GraphFlow because architecture diagrams are inert: they show how a system should work, never how it behaves when a database slows down or a queue backs up.
>
> You draw services, queues, caches and databases, then push simulated traffic through them. You can slow a node, raise its error rate, take it down, or throw a surge at the edge, and watch queues back up, circuit breakers trip and failed messages route to a dead-letter queue.
>
> What it is not: it is a model. Latency, capacity and failure probability are numbers you set per node, so it shows how a topology behaves under those assumptions, not what your real system will do. I would like to hear where the model is too naive.
>
> How it works: everything runs client-side. The canvas is native SVG with cubic bezier edges, and the simulation tick runs on requestAnimationFrame, decoupled from React rendering. No account is needed to try it. You can import docker-compose.yml, Terraform, draw.io, Excalidraw and Mermaid, and export Mermaid, SVG/PNG, Terraform, Kubernetes manifests and k6 scripts. Some exports and unlimited saved projects are Pro ($12/month); the free tier is enough to try the simulation.
>
> The source is available under PolyForm Noncommercial (not OSI open source): https://github.com/Hanubaki/GraphFlow
>
> Feedback I would value: which failure modes are missing, and what would make a simulation like this trustworthy to you?

---

## 2. Product Hunt

- **Name:** GraphFlow
- **Tagline (60 chars max):** `System design diagrams that actually run`
- **Description (260 chars max):** `Draw services, queues and databases, then push simulated traffic through them. Slow a node, inject faults or a surge, and watch queues back up and breakers trip. Runs in the browser, no sign-in. Import docker-compose, export Terraform.`
- **Topics:** Developer Tools, Software Engineering, Tech
- **Links:** website, GitHub repo
- **Gallery:** the mp4 demo first, then 3 stills (surge, node inspector, export modal), then the OG image
- **Pricing field:** Freemium

**Maker's first comment:**

> Hi, I'm the maker. Static diagram tools draw boxes and lines. GraphFlow runs them: every edge carries simulated packets with per-node latency, failure probability and capacity, so bottlenecks and cascading failures show up the moment they happen.
>
> Try it without signing in: open the studio, load a template (a Stripe-style webhook ledger, a CQRS outbox, edge streaming under chaos), hit the surge button, then slow down the database.
>
> It is a model, not your real system, so treat the numbers as the result of the assumptions you set. The free tier covers the simulation; Pro ($12/month) adds unlimited saved projects, AI generation and Terraform export. Source is available under PolyForm Noncommercial.
>
> I'd love to know what failure scenario you would test first.

---

## 3. Reddit

Read each subreddit's sidebar and rules the day you post. Moderators enforce self-promotion rules strictly and rules change.

- **r/devops:** has a weekly self-promotion thread. Post there instead of a standalone post unless the current rules allow project posts.
- **r/softwarearchitecture:** rules not verified. Read them first.
- Never post the same text in several subreddits on the same day.

**Title:** `I built a browser tool that simulates traffic and failures through an architecture diagram (feedback wanted)`

**Body:**

> Disclosure: I'm the author.
>
> I kept running into diagrams that couldn't answer "what happens when this DB gets slow?" so I built GraphFlow. You draw services, queues and databases (or import docker-compose.yml), push simulated traffic through them, then slow a node, raise an error rate or throw a surge at the edge. You see queues back up, breakers trip and messages hit the DLQ.
>
> It's a model with numbers you set, so it shows behavior under your assumptions, not your real system. Free to try, no sign-in, runs in the browser. Source-available (PolyForm Noncommercial), not OSI open source.
>
> Link: https://graph-flow-virid.vercel.app/
>
> What failure modes would you want to test that I haven't modeled?

---

## 4. X / LinkedIn

> A system design diagram shows how a system should work. GraphFlow shows how it behaves: the queue that backs up, the dependency that drags everything down, the minutes it takes to recover. Runs in the browser, no sign-in. [attach graphflow-launch-demo.mp4] https://graph-flow-virid.vercel.app/

---

## Launch-day checklist

- [ ] Latest deploy live: `/rastgele-yol` returns 404, `/llms.txt` returns text
- [ ] One real end-to-end Lemon Squeezy test payment succeeded
- [ ] You can stay online 6-8 hours to answer every comment
- [ ] Demo video uploaded where needed (Product Hunt gallery, X)
- [ ] Posts go out one channel per day, Show HN first
- [ ] After launch: note every question asked in `.agents/product-marketing.md` (Customer Language, Objections)
