---
name: webperf-audit
description: >-
  Web performance optimization, React re-render diagnostics, bundle size reduction, 60 FPS animations,
  and Core Web Vitals (LCP, FID/INP, CLS). Use when fixing sluggish interfaces, lagging canvas loops, or reducing load times.
---

# Web Performance & Render Optimization Runbook

Standards for achieving silky 60 FPS client experiences and sub-second initial loads.

## 1. React Render Optimization

* **Memoization Strategy:**
  * Wrap high-frequency leaf components in `React.memo(Component, arePropsEqual)` (e.g., individual graph nodes, canvas items, list rows).
  * Use `useCallback` on handlers passed to memoized children to prevent reference breakage.
  * Use `useMemo` for heavy algorithmic transforms (e.g. cubic bezier tangents, geometry transforms).
* **State Colocation:**
  * Move rapidly changing state (e.g. cursor coordinates, hover tooltips, drag positions) as close to the leaf nodes as possible.
  * Avoid updating root application state on mousemove or requestAnimationFrame ticks.

## 2. Animation & Canvas Performance

* **GPU Offloading:** Animate strictly `transform` and `opacity`. Never animate `top`, `left`, `width`, or `height` inside `requestAnimationFrame`.
* **SVG vs Canvas:**
  * Use native SVG path element reuse (`<path d={d} />`) with CSS hardware acceleration (`will-change-transform`).
  * In RAF loops, compute geometry calculations synchronously before updating refs.

## 3. Bundle Splitting & Asset Optimization

* **Dynamic Code Splitting:** Lazy-load heavyweight modals and rare routes using `React.lazy()` and `Suspense`.
* **Vendor Chunk Separation:** Configure `vite.config.ts` with `manualChunks` to isolate vendor dependencies (`react`, `supabase`, `lucide-react`) for long-term browser cache reuse.
* **Cache Headers:** Set `Cache-Control: public, max-age=31536000, immutable` for hashed static assets.
