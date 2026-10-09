---
name: ci-cd-github-actions
description: >-
  CI/CD pipeline automation, GitHub Actions workflows, test matrixes, dependency caching, security secret scanning,
  and automated deployment triggers. Use when configuring build pipelines, release automation, or continuous integration.
---

# GitHub Actions CI/CD Pipeline Runbook

Standardized workflows for lightning-fast, reproducible, and secure continuous integration.

## 1. High-Performance Test & Build Workflow

Use dependency caching and fail-fast configurations (`.github/workflows/ci.yml`):

```yaml
name: CI Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run build --if-present

      - name: Execute Vitest Suite
        run: npm test
```

## 2. Security & Secret Governance

* Never print secret tokens, service role keys, or credentials in log output.
* Restrict pull request workflows from untrusted forks by checking repository context.
* Keep permissions minimal in each job: `permissions: { contents: read, pull-requests: write }`.
