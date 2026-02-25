# Supabase Coupling Map

## Coupling We Have Today

### 1) Auth Runtime

Supabase Auth is used for session/token flows:

- `src/proxy.ts`
- `src/lib/shared/infra/supabase/create-client.ts`
- `src/lib/shared/infra/auth/server-session.ts`
- `src/lib/shared/infra/auth/mobile-session.ts`
- `src/lib/modules/auth/**`

Impact: replacing Supabase requires a new auth provider adapter and session integration updates.

### 2) Storage Runtime

Supabase Storage is used through `ObjectStorageService`:

- `src/lib/modules/storage/services/object-storage.service.ts`

Impact: storage adapter exists as an interface (`IObjectStorageService`), so this is partly isolated.

### 3) Schema-Level Auth FK Coupling

15 schema files import `authUsers` from `drizzle-orm/supabase` and reference `auth.users` foreign keys.

Examples:

- `src/lib/shared/infra/db/schema/user-roles.ts`
- `src/lib/shared/infra/db/schema/profile.ts`
- `src/lib/shared/infra/db/schema/reservation.ts`
- `src/lib/shared/infra/db/schema/place-verification.ts`

Impact: direct dependency on Supabase-managed `auth.users` table shape/location.

Official guidance context:

- Supabase Auth docs recommend custom user tables in `public` and FK to `auth.users` with `on delete cascade`.
- Supabase Auth docs also state to use **primary key references only** for managed tables like `auth.users` because managed objects may change.

### 4) Supabase CLI Config and Templates

Supabase project config and email templates are versioned in `supabase/`.

Impact: operational coupling for auth/studio/local stack.

### 5) Managed Schema Drift Risk

Supabase troubleshooting guidance notes managed schemas (for example `auth`, `storage`) can change over time and direct references from migration tooling can create schema drift.

Impact: portability risk increases when app migrations/scripts depend on provider-managed internals instead of app-owned schema boundaries.

## What Is Already Provider-Agnostic

- Business-table query path is Drizzle-first (repository pattern).
- DB connection is standard Postgres via `DATABASE_URL` + `postgres` driver.
- Migrations are SQL files generated/managed through Drizzle tooling.

## Coupling Classification

- Low: app data CRUD/query layer (already Drizzle-based).
- Medium: schema references to `auth.users`.
- Medium: operational scripts that touch provider-managed objects.
- High: authentication flow semantics and tokens if moving off Supabase Auth entirely.

## Practical Rule for This Repo

- Keep FK references to `auth.users.id` only where needed.
- Avoid new coupling to provider-managed non-PK objects in `auth`/`storage` schemas.
- Prefer app-owned projection tables and sync mechanisms when provider-managed coupling grows.
