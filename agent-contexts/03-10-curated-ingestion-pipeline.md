---
tags:
  - agent-context
  - backend/place
date: 2026-03-09
previous: 03-09-venue-review-refresh.md
related_contexts:
  - "[[03-02-public-place-cache-invalidation]]"
  - "[[03-09-venue-review-refresh]]"
---

# [03-10] Curated Ingestion Pipeline

> Date: 2026-03-09
> Previous: 03-09-venue-review-refresh.md

## Summary

Implemented a repeatable curated-court ingestion pipeline for third-party directory sites, anchored on private place embeddings plus a semantic duplicate preflight before import. Added the database embedding table, production backfill flow, a duplicate-check script, fixture-backed threshold tests, and database documentation for the full website-to-seed runbook. Applied the pipeline to `cebupickleballcourts.com`, imported only safe rows, and captured duplicate/review artifacts for the rest.

## Related Contexts

- [[03-02-public-place-cache-invalidation]] - Relevant prior backend/place work and public place infrastructure context.
- [[03-09-venue-review-refresh]] - Recent venue-facing place-domain work in the same backend area.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/shared/infra/db/schema/place-embedding.ts` | Added private `place_embedding` schema with `vector(1536)` storage and indexes for semantic matching. |
| `src/lib/shared/infra/db/schema/index.ts` | Exported the new `place_embedding` schema. |
| `drizzle/0043_place_embedding.sql` | Added SQL migration for `vector` extension and `place_embedding` table. |
| `drizzle/meta/_journal.json` | Registered the new `0043_place_embedding` migration tag. |
| `src/lib/modules/place/place-embedding.ts` | Added server-only canonical text builder and embedding constants. |
| `scripts/backfill-place-embeddings.ts` | Added idempotent place-embedding backfill/upsert script. |
| `scripts/check-curated-court-duplicates.ts` | Added production duplicate preflight for curated-court CSVs using lexical plus embedding signals. |
| `src/lib/modules/place/curated-duplicate-checker.ts` | Extracted pure duplicate scoring and decision logic for repeatable testing. |
| `src/__tests__/lib/modules/place/curated-duplicate-checker.fixtures.ts` | Added fixture builders and real Cebu-style duplicate/review scenarios. |
| `src/__tests__/lib/modules/place/curated-duplicate-checker.test.ts` | Added branch-complete unit coverage for duplicate thresholds and edge cases. |
| `package.json` | Added commands for embedding backfill and curated duplicate preflight in local and production modes. |
| `scripts/output/cebupickleballcourts-urls.txt` | Captured explicit Cebu venue-detail URLs for deterministic extraction. |
| `scripts/output/cebupickleballcourts-curated-courts.csv` | Materialized the Cebu source CSV used for duplicate checking and import. |
| `scripts/output/cebupickleballcourts-curated-courts.approved.csv` | Wrote the post-dedupe approved import subset. |
| `scripts/output/cebupickleballcourts-curated-courts.duplicates.csv` | Wrote the rows classified as production duplicates. |
| `scripts/output/cebupickleballcourts-curated-courts.review.csv` | Wrote ambiguous rows for manual adjudication. |
| `scripts/output/cebupickleballcourts-curated-courts.dedupe-report.json` | Wrote structured duplicate-check report with scores and top matches. |

### Documentation

| File | Change |
|------|--------|
| `important/database/06-curated-court-ingestion.md` | Added the repeatable website-to-seed ingestion runbook. |
| `important/database/00-overview.md` | Linked the new curated-ingestion runbook from the database overview. |
| `important/database/03-migrations-and-scripts.md` | Documented the new embedding backfill and duplicate-check scripts in the command surface. |

## Tag Derivation (From This Session's Changed Files)

- `backend/place` from `src/lib/modules/place/place-embedding.ts`, `src/lib/modules/place/curated-duplicate-checker.ts`, and related tests under `src/__tests__/lib/modules/place/`.

## Key Decisions

- Kept embeddings in a private `place_embedding` table instead of adding a vector column to `place`, so normal route payloads and repository reads stay clean by default.
- Standardized on OpenAI `text-embedding-3-small` with `1536` dimensions as the initial storage and comparison model for cost-efficient duplicate checking.
- Made duplicate preflight mandatory for new third-party website imports; direct production import of unreviewed source CSVs is no longer the safe path.
- Tightened the shared-social rule so a reused profile URL alone does not force a duplicate unless location/name or stronger semantic signals also agree.
- Captured real Cebu false-positive and review cases as fixed fixtures so future threshold tuning is regression-tested offline.

## Next Steps (if applicable)

- [ ] Review the two remaining Cebu ambiguous rows (`EVP Squared`, `Fervent Academy Pickleball Court`) and decide whether either should be imported.
- [ ] Keep adding real false-positive and false-negative cases from future `*.dedupe-report.json` files into the duplicate-checker fixtures.
- [ ] Consider moving the Cebu direct-extraction fallback into a reusable site-to-CSV helper if more non-conforming directory sites appear.

## Commands to Continue

```bash
pnpm db:check:curated-duplicates:production -- --file scripts/output/<source>-curated-courts.csv
pnpm db:import:curated-courts -- --file scripts/output/<source>-curated-courts.approved.csv --dry-run
pnpm exec dotenvx run --env-file=.env.production -- tsx scripts/import-curated-courts.ts --file scripts/output/<source>-curated-courts.approved.csv
pnpm db:backfill:place-embeddings:production
pnpm exec vitest run src/__tests__/lib/modules/place/curated-duplicate-checker.test.ts
```
