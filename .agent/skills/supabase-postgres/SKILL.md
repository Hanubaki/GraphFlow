---
name: supabase-postgres
description: >-
  Production Supabase & PostgreSQL patterns, Row Level Security (RLS) policies, schema migrations,
  performant indexing, and Edge Functions. Use when designing backend schemas, securing data access, or writing SQL migrations.
---

# Supabase & PostgreSQL Architecture Runbook

Guidelines for resilient, secure, and scalable cloud databases.

## 1. Row Level Security (RLS) Discipline

Always enable RLS immediately upon creating any table:

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Select policy: users can view their own projects or public projects
CREATE POLICY "Users can view own or public projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Insert policy: authenticated users can insert with their own user_id
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update policy: users can only modify their own rows
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Delete policy: users can only delete their own rows
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

## 2. Indexing Best Practices

* Always add B-Tree indexes on foreign keys (`user_id`, `project_id`, `org_id`).
* Add composite indexes on columns frequently queried together:
  `CREATE INDEX idx_projects_user_updated ON projects (user_id, updated_at DESC);`
* Use GIN indexes for JSONB fields when querying inside nested payloads.

## 3. Schema Migrations & Integrity

* Enforce `ON DELETE CASCADE` or `ON DELETE SET NULL` intentionally on foreign keys.
* Maintain an `updated_at` trigger to automatically bump timestamps on row mutation.
* Store sensitive operations (billing status, pro tier flags) in tables where only service roles have write permissions.
