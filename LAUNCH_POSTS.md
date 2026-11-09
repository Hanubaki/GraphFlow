# Launch post drafts (HN / Reddit)

Post these yourself while logged in. Do not post the same text to several places on the same day.

## Show HN

**Title:** Show HN: GraphFlow – architecture diagrams that run (queues, p99, chaos) in the browser

**URL:** https://graph-flow-virid.vercel.app/?template=stripe-webhook-ledger

**First comment (post right after submitting):**

I got tired of architecture reviews where a 2,500 RPS cache and a 400 RPS database are the same rectangle. GraphFlow is a canvas where each node has a capacity, base latency and failure rate, and packets actually travel along the edges. Past ~75% utilization, queueing delay grows and p95/p99 climb; failing nodes produce 5xx packets, and circuit breakers trip.

Try it: open the link, drag the Load slider from 1x to 3.5x, then select the Postgres node and hit Kill.

How it works: native SVG with cubic béziers (no canvas library), a requestAnimationFrame loop that reads from refs so React does not re-render per frame, and a simple utilization-based queueing curve. It is a model, not a benchmark: imported nodes show an "est." badge until you enter real numbers.

It can import docker-compose.yml, Terraform, draw.io, Excalidraw and Mermaid, and export Mermaid, Terraform, k8s manifests and k6 scripts (some exports are Pro).

Licensing, up front: the source is public under PolyForm Noncommercial 1.0.0, so it is source-available, not OSI open source. Repo: https://github.com/Hanubaki/GraphFlow

I would most like feedback on the latency curve above 80% utilization, and on which failure modes you would want next (connection pool starvation, retry storms).

## Reddit: r/reactjs or r/webdev (Showoff Saturday thread only, check the sub's current rules first)

**Title:** I built a browser system-design simulator in React with no canvas library (SVG + rAF outside React's render cycle)

**Body:** Short technical write-up: why native SVG instead of Pixi/Konva, how the sim loop reads from mutable refs and an O(1) lookup map to avoid re-renders, and the mobile bug where a 50000x50000px SVG plus backdrop-blur allocated a multi-gigapixel texture and dropped Safari to ~4 FPS. Link to the demo and the repo at the end. State the license (PolyForm Noncommercial) in the post.

## Notes

- Before posting to HN, remove the guest locks on components and templates. Show HN expects people to try it without signing up.
- Reply to every comment in the first 2 hours; that decides the outcome more than the title.
- Best window: Tuesday to Thursday, around 14:00-16:00 Turkey time (US morning).
