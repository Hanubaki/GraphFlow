---
name: state-management
description: >-
  Scalable frontend state management patterns, Zustand stores, React Context architecture,
  immutable mutations, undo/redo history stacks, and decoupled store actions. Use when refactoring complex state or implementing command patterns.
---

# Frontend State Architecture & Store Patterns

Design principles for predictable, bug-free, and high-performance client state.

## 1. Store Granularity & Slices

* Divide monolithic state into logical slices (e.g. `graphSlice`, `simulationSlice`, `uiSlice`).
* Separate **persistent state** (nodes, connections, settings) from **transient state** (mouse coordinates, active dragging node, hovering state).
* Keep derived data out of stores: calculate values dynamically via selectors or `useMemo`.

## 2. Command Pattern (Undo / Redo History)

Maintain an immutable history stack with strict size bounds (e.g. 50 snapshots):

```typescript
interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

function pushState<T>(history: HistoryState<T>, nextPresent: T): HistoryState<T> {
  return {
    past: [...history.past.slice(-49), history.present],
    present: nextPresent,
    future: [] // Truncate redo on new action
  };
}
```

* Always deep-clone or immutably copy modified entities (e.g. using object spread `{ ...node }` or `structuredClone`).
* Never mutate arrays or state objects directly (`state.nodes.push(n)` is prohibited).

## 3. Context vs Dedicated Store

* Use **React Context** for low-frequency global settings (e.g. Auth session, Color theme, Active language).
* Use **Zustand / Custom Hook Store** with granular selectors for high-frequency data (canvas nodes, animations, audio triggers) to avoid whole-tree re-renders.
