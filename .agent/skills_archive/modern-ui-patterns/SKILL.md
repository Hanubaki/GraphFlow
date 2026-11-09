---
name: modern-ui-patterns
description: >-
  Standardizes modern, production-grade web design, UI/UX aesthetics, consistent component sizing,
  segmented controls, dark-mode elegance, responsive layouts, and clean typography. Use when building,
  styling, or refactoring web interfaces, toolbars, buttons, modals, and responsive canvas layouts.
---

# Modern UI/UX Engineering & Design Patterns

A comprehensive runbook and design standard for building sleek, enterprise-grade, high-converting interfaces without UI "slop".

## 1. Core Ergonomics & Sizing Tokens

Consistency across heights, padding, and tap targets is paramount.

* **Compact / Toolbars (`h-8` standard):**
  * Height: `h-8` (32px)
  * Font: `text-xs font-semibold`
  * Padding: `px-2.5`
  * Icon size: `w-3.5 h-3.5`
* **Micro Controls (`h-7` nested/segmented):**
  * Height: `h-7` (28px)
  * Font: `text-[11px]` or `text-xs font-medium`
  * Padding: `px-2`
  * Icon size: `w-3.5 h-3.5`
* **Primary / Hero Actions (`h-10` CTA):**
  * Height: `h-10` (40px)
  * Font: `text-sm font-semibold`
  * Padding: `px-4`
  * Icon size: `w-4 h-4`
* **Border Radii:**
  * Containers & Modals: `rounded-2xl` or `rounded-xl`
  * Buttons & Inputs: `rounded-lg`
  * Nested / Segmented items: `rounded` or `rounded-md`

## 2. Segmented Control & Tool Grouping Pattern

Avoid scattered individual buttons in dense navigation or canvas toolbars. Group related tools into segmented containers:

```tsx
{/* Segmented Group Container */}
<div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/90 p-0.5 h-8 shrink-0">
  <button className="flex items-center gap-1.5 h-7 px-2 rounded hover:bg-slate-800/80 text-slate-200 text-xs font-medium transition-colors">
    <Icon className="w-3.5 h-3.5 text-cyan-400" />
    <span className="hidden xl:inline">Action 1</span>
  </button>
  
  {/* Subtle Vertical Divider */}
  <div className="h-3.5 w-px bg-slate-800" />
  
  <button className="flex items-center gap-1.5 h-7 px-2 rounded hover:bg-slate-800/80 text-slate-200 text-xs font-medium transition-colors">
    <Icon className="w-3.5 h-3.5 text-purple-400" />
    <span className="hidden xl:inline">Action 2</span>
  </button>
</div>
```

## 3. Responsive Text Collapse & Overflow Protection

Prevent toolbar breaks, overlapping buttons, or horizontal scrollbar leaks:

1. **Protect Essential Actions:** Apply `shrink-0` to critical buttons (Export, Sign In, Upgrade, Primary CTA) so flex containers never crush them.
2. **Progressive Text Degradation:**
   * Text hides on narrow viewports: `<span className="hidden sm:inline">Text</span>` or `<span className="hidden xl:inline">Text</span>`.
   * The icon always remains visible as a recognizable glyph.
3. **Dynamic Truncation:**
   * Use `max-w-[75px] truncate` for variable user content (usernames, project titles) in tight toolbars.

## 4. Dark Theme Palette & Visual Hierarchy

* **Surfaces:**
  * Base Background: Deep Obsidian (`#080c14` or `bg-slate-950`)
  * Panels & Cards: Deep Slate (`bg-slate-900/90 border border-slate-800/80`)
  * Elevated Menus & Modals: `bg-slate-900 border border-slate-700/80 shadow-2xl`
* **Accents & Glows:**
  * Cyan/Sky for Primary / Flow: `text-cyan-400`, `bg-cyan-600 hover:bg-cyan-500`
  * Purple/Violet for AI / Intelligence: `text-purple-400`, `border-purple-500/40 bg-purple-950/30`
  * Amber/Emerald for Status / Telemetry: `text-amber-400`, `text-emerald-400`
  * Rose for Destructive / Disconnects: `text-rose-400 hover:border-rose-900`
* **Typography & Icons:**
  * **Strictly No UI Slop:** Avoid raw emojis in professional software interfaces. Use crisp, vector SVG icons (e.g. `lucide-react`).
  * Monospace for technical telemetry, coordinates, and metrics (`font-mono text-xs`).

## 5. Infinite Canvas & Viewport Auto-Centering Pattern

When calculating viewport bounds for graphs, diagrams, or flowcharts:

1. Compute minimal bounding box: $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$.
2. Add comfortable padding ($P \approx 100\text{px}$).
3. Calculate fit scale: $\text{scale} = \min\left(\frac{W_{\text{canvas}}}{W_{\text{content}} + 2P}, \frac{H_{\text{canvas}}}{H_{\text{content}} + 2P}\right)$ clamped to $[0.4, 1.2]$.
4. Center offsets:
   $$\text{offset}_X = \frac{W_{\text{canvas}} - (x_{\max} + x_{\min}) \cdot \text{scale}}{2}$$
   $$\text{offset}_Y = \frac{H_{\text{canvas}} - (y_{\max} + y_{\min}) \cdot \text{scale}}{2}$$
