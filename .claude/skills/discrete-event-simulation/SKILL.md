---
name: discrete-event-simulation
description: >-
  Discrete Event Simulation (DES), queuing theory (M/M/c/K, Kingman's formula), deterministic virtual clock,
  DAG trace causality, cascading failure modeling, connection pool exhaustion, and backpressure.
  Use when designing, modeling, testing, or refactoring the distributed systems simulation engine.
---

# Discrete Event Simulation & Queuing Theory Runbook

Production-grade engineering standards for building a mathematically rigorous, deterministic distributed systems simulation engine in TypeScript.

---

## 1. Core Architecture: Discrete Event Simulation (DES)

Never drive distributed systems physics using `setInterval` or `requestAnimationFrame` ticks directly. A real engine separates **Simulation Time (Virtual Clock)** from **Wall-Clock Rendering**.

### The Virtual Clock & Priority Queue
1. **Event Priority Queue (Min-Heap):**
   * All state transitions are modeled as discrete events ordered strictly by `timestamp: number` (virtual milliseconds).
   * Events include:
     * `PACKET_DISPATCH` (Ingress arrival at client / gateway)
     * `QUEUE_ENQUEUE` (Packet placed into a node's buffer)
     * `SERVICE_START` (Worker / connection acquired from pool)
     * `SERVICE_COMPLETE` (Processing done, forward to downstream or return response)
     * `TIMEOUT_EXPIRED` (Packet unserviced past timeout threshold; emits 504 / drop)
     * `CIRCUIT_TRIP` / `CIRCUIT_HALF_OPEN` (Resilience state transitions)
2. **Decoupled Execution:**
   * The engine advances `simTime` from event to event, jumping directly across idle periods.
   * Enables:
     * **Instant Monte-Carlo / Batch Runs:** Simulate 10,000 requests in 25ms.
     * **Predictive Post-Mortem Analysis:** Calculate time-to-OOM or queue overflow under surge before rendering a single pixel.
     * **Smooth UI Interpolation:** Render thread consumes simulation snapshots via ring buffers without blocking calculation.

---

## 2. Queuing Theory & Saturation Curves

### $M/M/c/K$ Multi-Server Bounded Queue Model
Every node (Service, Database, Queue) implements bounded capacity:
* $\lambda$: Arrival rate (Poisson process with parameter $\lambda$, inter-arrival $\Delta t = -\ln(U) / \lambda$).
* $\mu$: Service rate per worker.
* $c$: Concurrency limit (Thread pool size, DB connection pool size, worker pods).
* $K$: Maximum queue buffer capacity (e.g. 500 requests). If depth $> K$, emit `DROP` or `HTTP 429`.

### Kingman's VUT Equation & Asymptotic Saturation
In distributed systems, latency is **never linear** ($y \neq ax + b$). It follows asymptotic queuing delay:
$$E[W_q] \approx \left(\frac{\rho}{1-\rho}\right) \cdot \left(\frac{C_a^2 + C_s^2}{2}\right) \cdot \left(\frac{1}{\mu}\right)$$
Where:
* $\rho = \frac{\lambda}{c \mu}$ is resource utilization ($0 \le \rho < 1$).
* When $\rho \ge 1.0$, the queue diverges: backlog grows at rate $(\lambda - c\mu)$ per unit time.
* Tail latency (p95, p99) reflects variance in service time (Log-Normal or Pareto distribution), not Gaussian noise.

---

## 3. Causal DAG Traversal & Trace Context

Simulate request lifecycles through actual graph topology, not random edge selection:

```typescript
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  rootPath: string[]; // Node IDs in execution order
  currentHop: number;
  payloadSizeKb: number;
  startTimeSim: number;
  status: 'in_flight' | 'completed' | 'timeout' | 'rejected' | 'failed';
}
```

* **DAG Execution:** When a client sends a request, it traverses edges according to the declared dependency graph.
* **Scatter-Gather / Fan-out:** If a gateway calls Service A and Service B in parallel, the parent span awaits both downstream responses. The slowest downstream determines upstream p99 (tail latency amplification).

---

## 4. Cascading Failure & Resilience Mechanics

### 1. Connection & Thread Pool Exhaustion
* When a downstream node (e.g. Postgres) increases latency from 10ms to 500ms, upstream workers remain blocked waiting for socket reads.
* Upstream worker pool ($c$) depletes to 0 available workers.
* Incoming requests queue up, hit timeout, and trigger **Cascading Failure** up to the edge gateway.

### 2. Autonomous Circuit Breakers
State machine per outbound client edge:
* **CLOSED:** Normal operation. Tracks failures in a rolling window of $N$ seconds.
* **OPEN:** Trips when failure rate exceeds threshold (e.g. $> 50\%$). Immediately fails requests fast with `503 Service Unavailable` without placing load on degraded downstream.
* **HALF-OPEN:** Cooldown period expires (e.g. 5s virtual time). Allows $M$ canary probe requests. If canaries succeed, transition to `CLOSED`; if any fail, reset cooldown to `OPEN`.

### 3. Backpressure & Flow Control
* Upstream must observe downstream queue depth.
* Strategies:
  * Drop tail / Drop head
  * Exponential Backoff with Full Jitter: $T_{\text{wait}} = \text{random}(0, \min(T_{\text{max}}, T_{\text{base}} \times 2^{\text{retry}}))$
  * CoDel (Controlled Delay) / Little's Law based concurrency governors.

---

## 5. Deterministic Reproducibility (Seeded PRNG)

Never use unseeded `Math.random()`. All stochastic variations (packet drop, jitter, latency variance) must derive from a deterministic pseudorandom number generator:

```typescript
// Mulberry32 32-bit PRNG
export function createPrng(seed: number) {
  return function next(): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

* Ensures that any scenario, fault injection, or surge test can be shared via URL and reproduced identically down to the microsecond on any machine.
