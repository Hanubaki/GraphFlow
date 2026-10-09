---
name: token-optimization
description: >-
  Optimizes AI agent context window budget, token consumption, prompt efficiency, and concise output
  workflows. Use when working on large codebases, managing long sessions, reading files, or preventing
  context window saturation and performance degradation.
---

# Agent Token & Context Window Optimization Runbook

Guidelines and best practices to keep context lean, fast, and within bounded token budgets while maximizing reasoning accuracy.

## 1. Surgical File Inspection (Line-Bounded Reading)

* **Anti-Pattern:** Using `view_file` on entire 500–1000+ line files when only checking a function or header.
* **Optimized Procedure:**
  * First use terminal search (`git grep`, `Select-String`, `findstr`, or AST queries) to locate relevant line numbers.
  * Use `view_file` with explicit `StartLine` and `EndLine` (e.g. 50–100 lines max).
  * Never ingest compiled files, locks (`package-lock.json`), build bundles (`dist/`), or minified code into context.

## 2. Contiguous Block Edits Over Full File Rewrites

* **Anti-Pattern:** Overwriting entire files with `write_to_file` when changing a 10-line function. This burns tokens both on output and future context re-reads.
* **Optimized Procedure:**
  * Use `replace_file_content` with precise `StartLine`, `EndLine`, and unique `TargetContent`.
  * Only touch the exact lines undergoing mutation.
  * Keep changes atomic and test-verified.

## 3. High-Density Communication & Zero Filler

* **Anti-Pattern:** Conversational preamble, repeating user requests, and printing massive markdown duplicates of code that exists in the repo.
* **Optimized Procedure:**
  * Eliminate polite filler ("Certainly!", "I will now proceed to...", "As per your request...").
  * Deliver direct actions, concise diff summaries, and clickable file references (`[FileName](file:///path)`).
  * Keep explanation dense: focus on architectural rationale and non-obvious edge cases, not stating what the code visibly does.

## 4. Progressive Disclosure

* **In Skills & Agents:**
  * Keep the root `SKILL.md` or prompt under 100 lines.
  * Move secondary documentation, exhaustive API tables, and schemas to `references/<topic>.md`.
  * The agent only loads reference files when a specific trigger condition is met.

## 5. Artifact Discipline

* **When to Use Artifacts:**
  * Use markdown artifacts for persistent documents, architecture diagrams, and complex execution plans.
  * Once written to an artifact, do **not** re-summarize or regurgitate the content in the chat. Link directly to the artifact.
