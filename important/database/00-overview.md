# Database Overview

## Purpose

This set of docs records the current database approach and defines a portability-first rule:

- PostgreSQL is the data store (currently hosted on Supabase).
- Drizzle is the database interface for application data access, schema, migrations, and DB scripts.
- Supabase SDK usage is limited to platform services (Auth and Storage), not business-table CRUD.

## Current Snapshot

- Runtime app queries: Drizzle repository pattern via `DbClient` from `src/lib/shared/infra/db/drizzle.ts`.
- Schema source of truth: `src/lib/shared/infra/db/schema/*` exported via `src/lib/shared/infra/db/schema/index.ts`.
- Migration tooling: `drizzle-kit` via `pnpm db:*` scripts in `package.json`.
- Script posture: mostly Drizzle-based, with two current raw-SQL exceptions.
- Supabase coupling remains in Auth, Storage, and `auth.users` foreign-key references.

## Table of Contents

1. [Current Architecture](./01-current-architecture.md)
2. [Drizzle-First Data Access Contract](./02-drizzle-first-contract.md)
3. [Migrations and Script Operations](./03-migrations-and-scripts.md)
4. [Supabase Coupling Map](./04-supabase-coupling-map.md)
5. [Portability Roadmap](./05-portability-roadmap.md)
6. [Curated Court Ingestion Pipeline](./06-curated-court-ingestion.md)
7. [Official Sources](./99-official-sources.md)

## Decision Statement

For application data, Drizzle is the mandatory interface boundary. Any database interaction that can affect portability (queries, schema changes, data migrations, operational scripts) should run through Drizzle conventions first, with explicit exceptions documented.

## Documentation Basis

This folder is based on:

- Repository analysis of the current codebase.
- Official Drizzle and Supabase documentation discovered through Context7 + web search.

See `important/database/99-official-sources.md` for links and traceability.
