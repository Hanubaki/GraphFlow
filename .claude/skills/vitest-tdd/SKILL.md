---
name: vitest-tdd
description: >-
  Test-driven development, mathematical verification, and regression test suites using Vitest and React Testing Library.
  Use when writing unit tests, testing geometry/canvas math, verifying responsive behavior, or validating billing and auth flows.
---

# Test-Driven Verification & Vitest Standards

A disciplined guide to verifying frontend logic, math algorithms, and user interaction flows with high speed and zero flakiness.

## 1. Mathematical & Algorithmic Unit Tests

* Test pure functions (coordinate transforms, cubic bezier evaluations, bounding box formulas) without mounting the DOM.
* Explicitly cover boundary cases:
  * Empty arrays / zero nodes.
  * Collinear or overlapping nodes.
  * Negative and extreme coordinates.
  * Zero-size viewports ($W=0, H=0$) and aspect ratio extremes ($16:9$, $9:16$, ultrawide).

## 2. Integration & State Store Testing

* Test state transitions using standard mock stores.
* Verify undo/redo stacks maintain pristine immutability across operations.
* Ensure simulation step evaluations produce deterministic particle packets.

## 3. Fast Execution

* Run targeted tests during active development:
  `npm test -- src/test/viewport-autocenter.test.ts`
* Keep all unit tests synchronous and free from arbitrary `setTimeout` delays.
