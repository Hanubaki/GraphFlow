---
name: git-ninja
description: >-
  Advanced Git workflows, Conventional Commits, branch hygiene, interactive rebasing, merge conflict resolution,
  and atomic commit structuring. Use when committing code, managing git history, or untangling git status.
---

# Git Ninja & Version Control Runbook

Discipline for creating clean, auditable, and production-grade git histories.

## 1. Conventional Commits Standard

Every commit must use the Conventional Commits specification:

* `feat(scope): add new user-facing functionality`
* `fix(scope): resolve a defect or bug`
* `perf(scope): code change that improves performance`
* `refactor(scope): code change that neither fixes a bug nor adds a feature`
* `test(scope): adding missing tests or correcting existing tests`
* `style(scope): changes that do not affect the meaning of the code (formatting, white-space)`
* `chore(scope): updates to build tasks, dependencies, gitignore, or configurations`

## 2. Atomic Commits Discipline

* **Single Responsibility:** Each commit should represent one cohesive logical change. Never bundle unrelated UI styling, security patches, and database migrations into a single commit.
* **Working Tree Integrity:** Verify `git status` before committing. Ensure untracked build artifacts, temporary log files, and `.env` secrets are strictly ignored.
* **Pre-Commit Verification:** Run relevant unit tests or lints before creating a commit. Never commit broken builds.

## 3. Conflict Resolution & Branch Hygiene

* When resolving conflicts, understand both intent streams before keeping either block.
* Avoid ugly merge commits when syncing feature branches; prefer rebase onto main (`git pull --rebase origin main`).
* Keep stash entries named descriptively (`git stash push -m "WIP: canvas refactor"`).
