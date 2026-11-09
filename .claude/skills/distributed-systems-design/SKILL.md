---
name: distributed-systems-design
description: >-
  Distributed systems architecture patterns, event-driven design, message queues (Kafka, RabbitMQ), circuit breakers,
  Saga patterns, caching strategies, and chaos engineering. Use when modeling, simulating, or architecting backend services.
---

# Distributed Systems Architecture & Resilience Runbook

Proven patterns for designing fault-tolerant, horizontally scalable distributed backends.

## 1. Resilience & Fault Tolerance Patterns

* **Circuit Breaker:** Trip state to `OPEN` when consecutive failures exceed threshold (e.g. 5 failures within 10s). Fast-fail incoming requests to avoid cascading service degradation.
* **Bulkhead Pattern:** Isolate critical resources (e.g. thread pools, database connection pools) so failures in one downstream dependency cannot starve other subsystems.
* **Retry with Exponential Backoff & Jitter:** Prevent "thundering herds" by scattering retry intervals across randomized windows.

## 2. Asynchronous Messaging & Event-Driven Topologies

* **Outbox Pattern:** Guarantee dual-write consistency between database transactions and message broker events. Write events into an `outbox` table within the same ACID transaction, then poll/stream to Kafka.
* **Idempotent Consumers:** Every message consumer must be capable of processing duplicate deliveries without corrupting state.
* **Dead-Letter Queues (DLQ):** Divert poison-pill messages after $N$ failed retries to prevent blocking partitions.

## 3. Caching & Data Consistency

* **Cache Aside:** Read cache $\rightarrow$ if miss, read database $\rightarrow$ write cache. On update, invalidate cache rather than overwriting.
* **Cache Stampede Prevention:** Use probabilistic early expiration (XFetch algorithm) or distributed locks (Redis Redlock) when rebuilding expensive caches.
