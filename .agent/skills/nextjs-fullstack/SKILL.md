---
name: nextjs-fullstack
description: >-
  Next.js App Router architecture, React Server Components (RSC), Server Actions, streaming SSR,
  route handlers, and granular cache revalidation tags. Use when building or refactoring Next.js fullstack applications.
---

# Next.js Fullstack & Server Components Runbook

Architectural guide to maximizing speed, security, and developer ergonomics with Next.js App Router.

## 1. Server vs Client Component Boundary

* **Default to Server Components:** Keep data fetching, database access, and heavy libraries on the server to achieve zero client-side bundle impact.
* **Push `'use client'` to the Leaves:** Only mark leaf components with `'use client'` when they require event listeners (`onClick`), browser hooks (`useState`, `useEffect`), or Web APIs.

## 2. Server Actions & Mutations

* Always validate incoming formData or parameters with Zod schemas inside Server Actions.
* Authenticate user session before performing mutations:
  ```typescript
  export async function updateProjectAction(id: string, data: unknown) {
    'use server';
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Unauthorized');
    // Mutate state & revalidate
    revalidateTag(`project-${id}`);
  }
  ```

## 3. Granular Caching & Revalidation

* Use `fetch(url, { next: { tags: ['projects'] } })` for tagged caching.
* Call `revalidateTag('projects')` upon mutation for instant, laser-targeted cache invalidation.
