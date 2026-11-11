---
name: api-design
description: >-
  RESTful API design, RFC 7807 problem details error handling, pagination, idempotency, rate limiting,
  and webhook dispatch architecture. Use when creating serverless API routes, webhook endpoints, or client-server contracts.
---

# API Design & Serverless Contract Runbook

Standardized conventions for designing robust, predictable, and resilient HTTP and webhook APIs.

## 1. RESTful Conventions & Status Codes

* `200 OK`: Successful read or sync mutation.
* `201 Created`: Resource successfully provisioned (include `Location` header or resource ID).
* `400 Bad Request`: Validation failure or malformed payload.
* `401 Unauthorized`: Missing or invalid authentication token.
* `403 Forbidden`: Authenticated user lacks permission for this resource.
* `404 Not Found`: Resource does not exist.
* `429 Too Many Requests`: Rate limit threshold exceeded.

## 2. Standardized Error Response (RFC 7807)

Always return structured JSON errors instead of raw strings or HTML error pages:

```json
{
  "type": "https://api.graphflow.dev/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Too many requests. Please wait 60 seconds before retrying.",
  "instance": "/api/webhook"
}
```

## 3. Idempotency & Safe Retries

* For mutating operations (`POST /checkout`, `POST /projects`), support `Idempotency-Key` headers.
* When a duplicate key is encountered within a 24-hour TTL, return the cached result of the original execution without re-executing side effects.
