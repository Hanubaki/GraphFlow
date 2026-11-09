---
name: analytics-telemetry
description: >-
  Product analytics, telemetry event taxonomy, conversion funnels, error tracking, and privacy-first measurement.
  Use when implementing user behavior tracking, funnel monitoring, or telemetry instrumentation.
---

# Product Analytics & Telemetry Taxonomy Runbook

Engineering principles for instrumentation, event tracking, and data-driven product insights.

## 1. Event Taxonomy Discipline (Object-Action Standard)

Use consistent `[Object] [Action]` naming conventions:

* `Node Created`: `{ type: 'api_gateway', canvas_node_count: 5 }`
* `Simulation Started`: `{ rps_load: 500, chaos_error_rate: 0.05 }`
* `Checkout Clicked`: `{ tier: 'pro', source: 'topbar_upgrade_pill' }`
* `Architecture Exported`: `{ format: 'mermaid' | 'json' | 'png' }`

## 2. Privacy-First & Performance Guarantees

* **Zero PII Leakage:** Never track plain text passwords, credit card details, API tokens, or raw user emails in event properties.
* **Non-Blocking Telemetry:** Always dispatch analytics using non-blocking calls or `navigator.sendBeacon()` so network tracing never delays user interface responsiveness or page unloads.
