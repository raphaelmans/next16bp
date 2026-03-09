# Curated Ingestion Automation

## Purpose

This automation module owns the curated-court ingestion pipeline from external
source extraction through duplicate preflight and post-import embedding refresh.

## Structure

- `services/`
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

- `scripts/firecrawl-curated-courts.ts`
- `scripts/discover-curated-court-leads.ts`
- `scripts/check-curated-court-duplicates.ts`
- `scripts/import-curated-courts.ts`
- `scripts/seed-curated-courts.ts`
- `scripts/backfill-place-embeddings.ts`

Those files should stay wrapper-thin and defer to this module.
