# Portability Roadmap

## Goal

Keep PostgreSQL portable across PaaS providers by ensuring Drizzle is the stable interface for data layer work.

## Phase 1 - Lock the Boundary

- Adopt `important/database/02-drizzle-first-contract.md` as team policy.
- Require new DB scripts to use Drizzle by default.
- Require exception notes for provider-specific scripts.

## Phase 2 - Remove Current Drift

- Refactor `scripts/export-curated-places.ts` to Drizzle-based querying (or isolate as explicit reporting exception).
- Evaluate `scripts/seed-storage-buckets.ts` as a provider-ops script and label it as non-portable by design.
- Normalize migration numbering and verify `drizzle/meta/_journal.json` coverage for all intended migrations.

## Phase 3 - Reduce Schema Coupling to Supabase Auth

- Introduce an explicit boundary for auth identity references (for example an `app_user_identity` mapping layer).
- Minimize direct dependence on `drizzle-orm/supabase` imports in business-table schemas.
- Where auth FK is required, keep references to `auth.users.id` primary key only.
- Keep app authorization roles/preferences in app-owned tables (already present).

## Phase 4 - Provider Swap Readiness

- Keep `DATABASE_URL` as the only required DB endpoint abstraction for app data path.
- Maintain storage/auth adapters behind interfaces (`IObjectStorageService`, auth repository/service contracts).
- Document cutover runbook: auth migration, storage migration, env switch, migration replay, smoke validation.

## Ongoing Checks

- During PR review, reject business-table data access through Supabase data APIs.
- During migration review, ensure SQL artifacts and metadata are consistent.
- During script review, ask: "Is this app data?" If yes, default to Drizzle.
- During schema review, reject new references to provider-managed non-PK objects in `auth`/`storage` schemas.
