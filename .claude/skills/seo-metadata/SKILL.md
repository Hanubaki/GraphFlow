---
name: seo-metadata
description: >-
  Search Engine Optimization (SEO), OpenGraph social preview tags, Twitter cards, JSON-LD structured data,
  and meta viewport optimization. Use when optimizing landing pages, public URLs, or social share previews.
---

# Modern SEO & Social Graph Meta Tags Runbook

Comprehensive guidelines to ensure rich social previews on Twitter/X, LinkedIn, Discord, and top-tier search engine indexing.

## 1. Essential Head Tags (`index.html`)

```html
<!-- Primary Meta Tags -->
<title>GraphFlow – Interactive Distributed Architecture Simulator</title>
<meta name="title" content="GraphFlow – Interactive Distributed Architecture Simulator" />
<meta name="description" content="Design, test, and simulate distributed microservices, network latency, and throughput in real-time." />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Open Graph / Facebook / LinkedIn -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://graphflow.dev/" />
<meta property="og:title" content="GraphFlow – Interactive Distributed Architecture Simulator" />
<meta property="og:description" content="Design, test, and simulate distributed microservices, network latency, and throughput in real-time." />
<meta property="og:image" content="https://graphflow.dev/og-image.png" />

<!-- Twitter / X -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://graphflow.dev/" />
<meta property="twitter:title" content="GraphFlow – Interactive Distributed Architecture Simulator" />
<meta property="twitter:description" content="Design, test, and simulate distributed microservices, network latency, and throughput in real-time." />
<meta property="twitter:image" content="https://graphflow.dev/og-image.png" />
```

## 2. Dynamic Social Share Previews

* For public shared projects or embed links, dynamically inject project title and node count into the `<head>` tag.
* Ensure image aspect ratio is exactly 1200x630 (1.91:1) for optimal rendering across Slack, Discord, and LinkedIn.
* Provide canonical link tags (`<link rel="canonical" href="..." />`) to eliminate duplicate content penalties.
