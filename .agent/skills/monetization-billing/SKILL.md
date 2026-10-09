---
name: monetization-billing
description: >-
  SaaS monetization, Lemon Squeezy & Stripe payment flows, checkout overlays, webhook processing,
  subscription state management, and tier gating. Use when implementing pricing tables, checkout buttons, or customer billing portals.
---

# SaaS Monetization & Billing Runbook

Patterns for integrating high-converting checkout flows and secure webhook reconciliations.

## 1. Checkout Experience (Lemon.js / Stripe Elements)

* **Overlay Checkout Pattern:** Keep users inside your app rather than forcing an external redirect whenever possible.
  * Initialize Lemon.js overlay in `index.html`:
    `<script src="https://assets.lemonsqueezy.com/lemon.js" defer></script>`
  * Trigger checkout programmatically:
    `window.createLemonSqueezy?.(); window.LemonSqueezy.Url.Open(checkoutUrl);`
  * Listen for completion events (`LemonSqueezy.Setup({ eventHandler: (event) => ... })`) to refresh user session immediately.

## 2. Webhook Idempotency & Reconciliation

* **Verify Signature First:** Always validate `x-signature` before parsing or processing webhook payloads.
* **Idempotent State Updates:**
  * When receiving `subscription_created` or `subscription_updated`, upsert into your `subscriptions` table using the external subscription ID as unique key.
  * Handle edge cases: `subscription_cancelled` or `subscription_payment_failed` should gracefully downgrade the tier or flag grace periods.
* **Avoid Client-Side Trust:** Never allow client-side API requests to toggle `isPro` or grant premium entitlements. Entitlements must be granted strictly via serverless webhook handlers verifying signed payloads.

## 3. Tier Gating & Paywalls

* Provide clear visual distinction between Free and Pro capabilities (e.g. badge indicators, disabled controls with tooltip explanation).
* Always allow users to view or export their own existing work even if their subscription expires.
