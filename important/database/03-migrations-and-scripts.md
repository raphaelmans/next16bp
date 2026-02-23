# Migrations and Scripts

## Command Surface

Database commands are centralized in `package.json`:

- `pnpm db:pull`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:push`
- `pnpm db:studio`
- `pnpm db:seed:sports`
- `pnpm db:seed:buckets`
- plus backfill/import/export helpers

All run with `dotenvx` and `DATABASE_URL`.

## Migration Source

- Drizzle config: `drizzle.config.ts`
- SQL migration folder: `drizzle/*.sql`
- Schema entrypoint: `src/lib/shared/infra/db/schema/index.ts`

## Official Drizzle Semantics (Verified)

- `drizzle-kit generate`
  - Computes schema diff from Drizzle schema snapshots.
  - Writes migration SQL artifacts to disk (plus snapshot metadata).
- `drizzle-kit migrate`
  - Applies unapplied SQL migration files in order.
  - Stores applied migration history in DB (`__drizzle_migrations` by default; configurable table/schema).
- `drizzle-kit push`
  - Introspects current DB, diffs with schema, and applies SQL directly.
  - Omits migration SQL file generation.
  - Supports safety/visibility flags like `--strict` and `--verbose` (and `--force` for auto-accepting data-loss prompts).

These semantics come from official Drizzle docs; see `important/database/99-official-sources.md`.

## Project Policy vs Tool Capability

- Repository policy (`AGENTS.md`) treats `db:push` as dev-only.
- Drizzle docs indicate `push` can support rapid prototyping and can be part of production workflows depending on team strategy.
- For this codebase, preserve project policy: default to `generate` + `migrate`, and keep `push` scoped to controlled/dev cases.

## Script Posture (Current)

Scripts importing `postgres` in `scripts/`: 8

- Drizzle-based scripts (6):
  - `scripts/seed-sports.ts`
  - `scripts/backfill-place-slugs.ts`
  - `scripts/list-place-locations.ts`
  - `scripts/import-curated-courts.ts`
  - `scripts/backfill-court-addon-pricing-type.ts`
  - `scripts/validate-addon-pricing-migration.ts`
- Raw SQL / non-Drizzle exceptions (2):
  - `scripts/seed-storage-buckets.ts`
  - `scripts/export-curated-places.ts`

## Migration Hygiene Notes

- Migration directory currently contains duplicate numeric prefixes (`0015_*`, `0029_*`).
- `drizzle/meta/_journal.json` currently lists entries up to `0020_reservation_chat` while newer SQL files are present.

Action: align migration naming/journal practices so migration ordering remains deterministic and easy to audit.

## Recommended Operational Guardrails

- Prefer `db:generate` + `db:migrate` for schema changes.
- Treat `db:pull` as exceptional (introspection/recovery), not the default authoring path.
- Prefer Drizzle query builder in scripts; use raw SQL only when necessary and documented.
- If `db:push` is used, require explicit rationale in PR notes and run with review-friendly settings (`--strict`, `--verbose`) in sensitive environments.
