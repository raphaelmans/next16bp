# Current Architecture

## Runtime Data Path

- `src/lib/shared/infra/db/drizzle.ts` creates a singleton Drizzle client using `postgres` and `DATABASE_URL`.
- `src/lib/shared/infra/container.ts` injects `db` and `transactionManager` into modules.
- Repositories consume `DbClient` (`src/lib/shared/infra/db/types.ts`) and execute Drizzle query builder calls.

## Transaction Pattern

- `TransactionManager` is framework-agnostic at `src/lib/shared/kernel/transaction.ts`.
- Drizzle implementation lives at `src/lib/shared/infra/db/transaction.ts`.
- Services open transactions and pass `ctx: { tx }` into repositories (for example `src/lib/modules/place/services/place-management.service.ts`).

## Schema Ownership

- Schema files live under `src/lib/shared/infra/db/schema/`.
- Central export at `src/lib/shared/infra/db/schema/index.ts` is used by Drizzle runtime and migration tooling.
- Tables and enums are defined with Drizzle types and mostly paired with `drizzle-zod` schemas.

## Query Ownership

- Application DB access is primarily repository-driven (`src/lib/modules/**/repositories/*.ts`).
- No direct `supabase.from(...)` or `supabase.rpc(...)` usage is present in `src/` for business-table queries.

## Environment Model

- `DATABASE_URL` powers Drizzle connection/migrations.
- Supabase environment keys (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_*`) are still required for auth/storage flows (`src/lib/env/index.ts`, `.env.example`).
