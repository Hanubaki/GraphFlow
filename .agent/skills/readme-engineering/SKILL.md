---
name: readme-engineering
description: >-
  World-class open-source README and technical documentation craftsmanship. Enforces Tier-1 GitHub repository presentation:
  hero banners, dynamic SVG badges, "Why / Problem & Solution" narratives, interactive ASCII / Mermaid architectures,
  live demo teasers, deep engineering highlights, benchmarks, directory trees, and clear contribution standards.
  Use when designing, auditing, or refactoring GitHub README files to stand out to engineering leads, recruiters, and open-source contributors.
---

# 📖 World-Class README Engineering Runbook

High-impact open-source repositories (like Supabase, Tailwind, Excalidraw, and React) stand out because their `README.md` immediately communicates technical authority, visual polish, and frictionless onboarding within 5 seconds.

---

## 1. The 5-Second Rule (Hero Architecture)

Every top-tier README must lead with an unmistakable visual identity:
* **Project Identity:** Clean centered logo / title with a bold, 1-sentence value proposition (no generic buzzwords).
* **Dynamic Badges:** Shields.io badges using flat-square or for-the-badge styles (React version, TypeScript version, Vite, Test suite status, License, Stars, PRs Welcome).
* **Live Demo & Action Callouts:** Clear pill buttons for `[Live Demo]`, `[Documentation]`, `[Report Bug]`, and `[Request Feature]`.
* **Visual Anchor:** An animated GIF, high-res canvas preview screenshot, or interactive visual illustrating the core product in action.

---

## 2. The "Why" Narrative (Pain Point $\rightarrow$ Breakthrough)

Never assume the reader already cares. Clearly articulate:
1. **The Problem:** Why are distributed systems hard to visualize and debug?
2. **The Solution:** How does GraphFlow eliminate this friction (client-side simulation, zero server overhead, real-time packet telemetry)?

---

## 3. Engineering Rigor & Technical Highlights

Highlight architectural decisions that signal senior engineering craft:
* **Algorithmic Foundation:** Detail math used (e.g., Cubic Bezier $B(t)$ De Casteljau evaluation, vector tangent calculations).
* **Decoupled Architecture:** Emphasize strict separation between the simulation engine (`requestAnimationFrame`), state store, and presentation layer.
* **Resilience & Chaos Engineering:** Mention packet loss injection, latency variance, and error-route recovery.
* **Performance Guarantees:** 60 FPS animation loops, DOM/SVG batching, and lightweight bundle footprint.

---

## 4. Visual Architecture & Component Flow

Always include clean, responsive Mermaid diagrams:
* Component topology and layer boundaries (`UI Layer` $\rightarrow$ `State / Engine` $\rightarrow$ `Audio / Math`).
* Clear directional arrows describing data flow, events, and state synchronization.

---

## 5. Frictionless Quick Start & Reproducibility

* **Zero-Guess Prerequisites:** Node.js version, package managers.
* **Atomic Shell Snippets:** Clone, install, run dev, run tests.
* **Environment Variables:** Provide clear `.env.example` guidance if external services (e.g., Supabase) are integrated.

---

## 6. Directory Hierarchy & Clean Boundaries

Provide an annotated file tree showing clean code organization:
```
src/
├── components/     # Atomic presentation components & modals
├── store/          # Zustand / Context state management & history
├── simulation/     # Decoupled tick loop & packet dispatcher
├── utils/          # Pure math (bezier, vector geometry, telemetry)
└── types/          # Strict TypeScript contracts & domain entities
```

---

## 7. Interactive Shortcuts, Author & Community

* **Keyboard Ergonomics Table:** Tabulated shortcut cheat sheet for developer efficiency.
* **Author Card:** GitHub avatar, profile link, and contribution guidelines.
* **License & Attribution:** Transparent open-source licensing.
