---
name: realtime-websockets
description: >-
  Real-time networking, WebSocket protocols, connection lifecycle management, heartbeat/ping-pong health checks,
  exponential backoff reconnection, and collaborative state syncing. Use when building real-time multiplayer, live telemetry, or chat.
---

# Real-Time WebSockets & Connection Resilience Runbook

Architectural standards for bulletproof real-time client-server communication.

## 1. Connection Lifecycle & Reconnection Loop

Never let a disconnected socket stay dead. Implement jittered exponential backoff:

```typescript
class ResilientSocket {
  private socket: WebSocket | null = null;
  private retryCount = 0;
  private maxDelay = 30000;

  connect(url: string) {
    this.socket = new WebSocket(url);
    this.socket.onclose = () => this.handleReconnect(url);
  }

  private handleReconnect(url: string) {
    const delay = Math.min(this.maxDelay, Math.pow(2, this.retryCount) * 1000 + Math.random() * 1000);
    this.retryCount++;
    setTimeout(() => this.connect(url), delay);
  }
}
```

## 2. Heartbeat & Dead Connection Detection

* Send periodic ping frames every 30 seconds.
* If a pong response is not received within 10 seconds, forcefully terminate and initiate reconnection (mitigates "zombie" half-open sockets caused by Wi-Fi drops).

## 3. Message Deduplication & Ordering

* Attach an incrementing `sequence_id` and unique `uuid` to every client event.
* Buffer outgoing messages in memory if the connection drops, and flush in chronological order upon reconnection.
