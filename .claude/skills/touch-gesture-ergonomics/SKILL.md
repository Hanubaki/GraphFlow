---
name: touch-gesture-ergonomics
description: >-
  Mobile touch gesture handling, multi-touch pinch-to-zoom, two-finger panning, inertia physics, touch cancellation,
  and tactile haptic feedback. Use when adapting canvases, graphs, and complex desktop interfaces for mobile and tablets.
---

# Mobile Touch Gestures & Canvas Ergonomics Runbook

Building responsive, native-feeling touch interactions for infinite canvas and complex web apps.

## 1. Pinch-to-Zoom Mathematical Formulation

Track distance between two touches ($T_1, T_2$):

$$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
$$\text{mid}_X = \frac{x_1 + x_2}{2}, \quad \text{mid}_Y = \frac{y_1 + y_2}{2}$$

When distance changes from $d_{\text{start}}$ to $d_{\text{current}}$, compute zoom factor:
$$s = \frac{d_{\text{current}}}{d_{\text{prev}}}$$

Zoom into the midpoint rather than the origin by adjusting pan offsets accordingly.

## 2. Touch Prevention & Conflict Resolution

* Add `touch-action: none` to canvas container CSS to disable default browser viewport pinch and page pull-to-refresh.
* Distinguish single-touch node dragging from two-finger canvas panning.
* Always clean up listeners on `touchend` and `touchcancel`.

## 3. Minimum Tap Targets & Touch Ergonomics

* Ensure all interactive touch targets measure at least $44 \times 44\text{px}$ (or $32\text{px}$ with $12\text{px}$ invisible padding).
* Provide visual feedback instantly upon `touchstart` (not delayed until `touchend`).
