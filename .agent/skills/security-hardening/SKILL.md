---
name: security-hardening
description: >-
  Enforces enterprise web security standards including Content Security Policy (CSP), API webhook rate-limiting,
  signature verification, XSS prevention, and data export sanitization. Use when configuring deployment headers,
  webhooks, third-party callbacks, or processing user-supplied graph/architecture data.
---

# Web Security & Production Hardening Runbook

Best practices for locking down client-side and serverless web applications against injection, abuse, and cross-site vectors.

## 1. Enterprise Content Security Policy (CSP)

Set strict security headers in deployment configurations (e.g. `vercel.json`):

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://assets.lemonsqueezy.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.lemonsqueezy.com; frame-src 'self' https://*.lemonsqueezy.com; object-src 'none'; base-uri 'self';"
}
```

* **X-Frame-Options:** Use `SAMEORIGIN` or allow specific embed routes via `frame-ancestors`.
* **X-Content-Type-Options:** `nosniff`.
* **Referrer-Policy:** `strict-origin-when-cross-origin`.

## 2. Webhook Security & Rate Limiting

* **HMAC Signature Verification:** Verify cryptographic signatures (e.g. `X-Signature` from Lemon Squeezy or Stripe) using `crypto.createHmac('sha256', secret)`.
* **Rate Limiting:** Protect serverless endpoints against DDoS with sliding window or token bucket algorithms (e.g. max 60 requests per minute per IP).
* **Payload Validation:** Validate incoming JSON schemas strictly before mutating database state or provisioning tiers.

## 3. Data Sanitization & Export Hardening

* **Prevent Stored XSS:** Strip `<script>`, `javascript:`, inline `onload/onerror` handlers, and SVG foreign objects from imported graph names, node labels, or descriptions.
* **Safe Serialization:** Always encode user strings properly when exporting to SVG, Markdown, or Mermaid definitions.
