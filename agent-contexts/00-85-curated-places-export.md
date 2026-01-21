# [00-85] Curated Places CSV Export

> Date: 2026-01-21
> Previous: 00-84-public-schedule-month-view.md

## Summary

Added a curated-only export script that pulls curated places from Postgres (Supabase) and writes a sales-friendly CSV with amenities/courts/photos aggregated into single columns. Removed the no-longer-needed Firecrawl scraping script and updated pnpm scripts accordingly.

## Changes Made

### Scripts

| File | Change |
|------|--------|
| `scripts/export-curated-places.ts` | New script to export curated places as CSV; supports `--output`, `--stdout`, and `--unclaimed-only`. |
| `scripts/firecrawl-curated-courts.ts` | Deleted (no longer supported). |

### Tooling

| File | Change |
|------|--------|
| `package.json` | Added `db:export:curated-places` script and removed `scrape:curated-courts`. |

### Lint/Format Hygiene

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/page.tsx` | Formatting-only fix to satisfy Biome check after removing unused imports. |

## Key Decisions

- Keep export scope curated-only for now (`place_type = 'CURATED'`) to match the sales workflow.
- Aggregate related rows into CSV-friendly fields: amenities (`;`), courts (`;`), and photo URLs (`,`).

## Commands to Continue

```bash
pnpm db:export:curated-places
pnpm db:export:curated-places -- --unclaimed-only
pnpm db:export:curated-places -- --stdout > curated-places-export.csv
pnpm lint
```
