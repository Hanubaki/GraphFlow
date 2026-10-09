---
name: systematic-debugging
description: >-
  Rigorous root-cause debugging, hypothesis testing, error isolation, stack trace analysis, and reproduction
  workflows. Use when diagnosing elusive bugs, unexpected state mutations, race conditions, or unhandled exceptions.
---

# Systematic Debugging & Root Cause Analysis Runbook

Never guess or apply "shotgun fixes". Follow this scientific method for rapid and accurate defect elimination.

## 1. The 4-Phase Diagnostic Cycle

1. **Reproduce Minimally:**
   * Isolate the exact minimal sequence of actions or inputs that triggers the defect.
   * Strip away irrelevant UI elements, store states, or network calls.
2. **Observe & Inspect State:**
   * Inspect console errors, stack traces, network payloads, or store snapshots.
   * Identify the exact file and line number where the anomaly originates.
3. **Formulate a Testable Hypothesis:**
   * State clearly: *"Variable X is undefined because asynchronous call Y completes after Z renders."*
   * Verify the hypothesis by checking variable values or adding targeted assertions.
4. **Targeted Remediation & Verification:**
   * Apply the smallest possible surgical fix.
   * Verify that the original reproduction path now succeeds without side effects.
   * Run existing test suites to prevent regressions.

## 2. Common Frontend Defect Archetypes

* **Asynchronous Race Conditions:** State updates completing after component unmounts or out of order. Fix with cleanup functions or `AbortController`.
* **Stale Closures:** `useCallback` or `useEffect` capturing old state/props. Fix by updating dependency arrays or using functional state updates (`setVal(prev => ...)`).
* **Reference Equality Pitfalls:** Creating new object/array literals inside render loops triggering infinite effect loops or unnecessary re-renders.
* **Layout Shifts / Overflow:** Missing `shrink-0`, negative margins, or unconstrained flex items. Fix with `min-w-0`, `overflow-hidden`, and explicit flex boundaries.
