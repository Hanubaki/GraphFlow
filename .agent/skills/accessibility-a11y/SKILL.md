---
name: accessibility-a11y
description: >-
  Web accessibility standards (WCAG 2.1 AA), keyboard navigation, focus management, ARIA landmarks,
  screen reader support, and color contrast compliance. Use when auditing UI components, adding keyboard shortcuts, or ensuring inclusive user interfaces.
---

# Web Accessibility (a11y) & Inclusive UI Runbook

Ensuring robust usability across screen readers, keyboard-only users, and varying visual abilities.

## 1. Keyboard Navigation & Focus Rings

* **Visible Focus:** Never use `outline-none` without an explicit replacement focus ring:
  `focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none`
* **Tab Order:** Ensure interactive elements (buttons, inputs, links) follow intuitive DOM order.
* **Escape to Close:** Every modal, popover, and context menu must listen for `Escape` to close and return focus to the trigger element.

## 2. ARIA Landmarks & Accessible Names

* **Icon-Only Buttons:** Any button containing only an icon must specify an accessible name:
  `<button aria-label="Undo last change" title="Undo (Ctrl+Z)"><Undo /></button>`
* **Role Clarifications:**
  * Modals: `role="dialog" aria-modal="true" aria-labelledby="modal-title"`
  * Alerts / Notifications: `role="status"` or `role="alert"`
  * Tab groups: `role="tablist"`, `role="tab"`, `role="tabpanel"`

## 3. Color Contrast & Motion Sensitivity

* **Contrast Ratio:** Maintain at least 4.5:1 contrast for normal text and 3:1 for large text or icons.
* **Prefers-Reduced-Motion:** Respect user system preferences by wrapping high-frequency animations or packet loops in `@media (prefers-reduced-motion: reduce)`.
