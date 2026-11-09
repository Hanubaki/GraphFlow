# Token Efficiency & Context Economy Rules

Enforces maximum token efficiency, minimal context consumption, and ultra-dense communication without compromising reasoning depth, code correctness, or edge-case handling.

## 1. Zero Conversational Overhead (Direct Density)
- Never output pleasantries, preamble, or repetition of user input ("Certainly", "I will now...", "As you requested").
- Never summarize completed file edits in long markdown paragraphs when the diff is already visible or self-explanatory.
- Provide direct answers, architectural rationale for non-obvious choices, and clickable file links (`[File.tsx](file:///path)`).

## 2. Surgical Context Ingestion (Read-Bounded)
- Never load whole files (>100 lines) with `view_file` when investigating a targeted logic or component.
- First locate line targets via `git grep`, `Select-String`, or symbol search.
- Call `view_file` strictly with bounded `StartLine` and `EndLine` (50–100 lines maximum).
- Never read build artifacts (`dist/`), lockfiles (`package-lock.json`), or minified bundles into context.

## 3. Atomic Mutations Over Full Rewrites
- Always use `replace_file_content` for targeted code modifications.
- Never overwrite entire multi-hundred line files with `write_to_file` when modifying isolated functions or components.
- Keep diffs surgical to preserve both output token budget and context footprint in multi-turn sessions.

## 4. Shell & Command Output Pruning
- Limit long-running or verbose terminal outputs with `Select-Object -First N`, `Select-String`, or `git log -n N`.
- Never let massive stack traces or test logs flood the prompt context.

## 5. Cache-Friendly Prompts (Prompt Caching Maximization)
- Keep core system rules, skills, and configuration stable at the start of the context to maximize 90% prompt caching hits.
- Never dynamically alter system instructions with lossy translations or pseudocode that invalidate cache keys.
