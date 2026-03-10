# Curated Ingestion Automation

## Purpose

This automation module owns the curated-court ingestion pipeline from external
source extraction through duplicate preflight and post-import embedding refresh.

## Structure

- `services/`
  - `curated-facebook-page-discovery.service.ts`
  - `curated-facebook-page-capture.service.ts`
  - `curated-facebook-ingestion-runner.service.ts`
  - `curated-lead-discovery.service.ts`
  - `firecrawl-curated-courts.service.ts`
  - `curated-duplicate-preflight.service.ts`
  - `curated-court-import.service.ts`
  - `curated-court-seed.service.ts`
  - `place-embedding-backfill.service.ts`
- `use-cases/`
  - `run-curated-ingestion-pipeline.use-case.ts`
- `factories/`
  - `curated-ingestion.factory.ts`
- `shared/`
  - CLI/runtime helpers
- `dtos/`
  - orchestration input types

## CLI Surface

The canonical human/operator interface remains:

- `scripts/run-curated-ingestion.ts`
- `scripts/run-curated-facebook-ingestion.ts`
- `scripts/firecrawl-curated-courts.ts`
- `scripts/discover-curated-court-leads.ts`
- `scripts/discover-curated-facebook-pages.ts`
- `scripts/capture-curated-facebook-pages.ts`
- `scripts/check-curated-court-duplicates.ts`
- `scripts/import-curated-courts.ts`
- `scripts/seed-curated-courts.ts`
- `scripts/backfill-place-embeddings.ts`

Those files should stay wrapper-thin and defer to this module.

## Preferred Operator Path

For unattended or production-like runs, prefer the resumable e2e runners:

- `pnpm scrape:curated:run:url`
- `pnpm scrape:curated:run:url:local`
- `pnpm scrape:curated:run:facebook`
- `pnpm scrape:curated:run:facebook:local`

Both runners are responsible for:

- iterating the configured province/city scope list
- resuming partially completed scopes
- skipping fully completed scopes
- importing approved rows sequentially
- verifying DB persistence before claiming success
