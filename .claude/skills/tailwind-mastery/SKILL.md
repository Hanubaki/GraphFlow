---
name: tailwind-mastery
description: >-
  Advanced Tailwind CSS styling patterns, responsive design, custom utilities, modern glassmorphism, dynamic animations,
  and clean dark mode aesthetics. Use when styling complex components, fixing layouts, or crafting modern UI visuals.
---

# Tailwind CSS Mastery & Visual Styling Runbook

Modern styling standards for sleek, responsive, and performance-friendly interfaces.

## 1. Modern Glassmorphism & Surface Depth

Create subtle, elegant glass overlays without compromising readability:

```tsx
// Subtle Glass Card / Modal
<div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl shadow-cyan-950/20 rounded-2xl p-6">
  {/* Content */}
</div>
```

* **Rules:**
  * Avoid heavy blur (`backdrop-blur-2xl`) which causes GPU stutter on low-end screens. Use `backdrop-blur-sm` or `backdrop-blur-md`.
  * Always pair backdrop blur with a thin border (`border border-slate-800/80` or `border-white/10`) to define edges.

## 2. Flexbox & Grid Ergonomics

* **Preventing Text / Button Crushing:** Always put `min-w-0` on flex items that contain truncated text (`truncate`), and `shrink-0` on icon buttons or actions.
* **Responsive Breakpoints:**
  * Mobile first: `w-full sm:w-auto`
  * Complex toolbars: `hidden md:inline`, `hidden xl:inline`
* **Custom Scrollbars:**
  * Use `scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent` or utility classes for sleek overflow areas.

## 3. Micro-Animations & Glow Effects

* Use hardware-accelerated transitions: `transition-all duration-150 ease-out`.
* Radial glows for focal points:
  `shadow-[0_0_15px_rgba(6,182,212,0.25)]`
* Active states: `active:scale-[0.98] transition-transform` for tactile native button feel.
