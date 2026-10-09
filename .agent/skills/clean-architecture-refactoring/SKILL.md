---
name: clean-architecture-refactoring
description: >-
  SOLID principles, Clean Architecture, Ports & Adapters, decoupling business logic from UI frameworks,
  code smell eradication, and cognitive complexity reduction. Use when refactoring messy code, reorganizing modules, or untangling spaghetti logic.
---

# Clean Architecture & Code Refactoring Runbook

Engineering guidelines to maintain high developer velocity, testability, and decoupled modularity.

## 1. Decoupling Domain Logic from React & UI

* **Anti-Pattern:** Embedding heavy algorithmic calculations (bezier math, packet routing, pricing logic) directly inside React component bodies or JSX hooks.
* **Refactored Approach:**
  * Extract pure calculation functions into dedicated `src/utils/` or domain service files.
  * Domain logic should have zero dependencies on React, DOM, or browser APIs where possible.
  * Keep React components purely responsible for presentation and user event dispatching.

## 2. SOLID Principles in Modern TypeScript

* **Single Responsibility (SRP):** Each module, hook, or function does one thing cleanly. If a component is managing state, fetching data, computing geometry, and rendering modals, split it.
* **Open/Closed (OCP):** Use catalog maps or configuration objects (e.g. `nodeCatalog.ts`) instead of massive `switch(node.type)` statements.
* **Dependency Inversion (DIP):** Depend on interfaces and abstraction contracts rather than concrete implementations (e.g. pass an abstract storage adapter to project save operations).

## 3. Cognitive Complexity Reduction

* Limit nesting depth to $\le 3$ levels. Use early returns (guard clauses) to flatten logic.
* Replace Boolean flag explosion (`isLoading`, `isError`, `isSuccess`, `isSubmitting`) with explicit finite state machines or tagged union states.
