# Curated Court Ingestion Pipeline

## Purpose

This runbook defines the repeatable pipeline for adding a new external court directory into curated places.

The pipeline is designed to avoid the failure mode we already hit with direct imports:

- scrape first
- semantic duplicate-check against production curated places
- import only approved rows
- backfill embeddings again so the next source benefits from the latest data

## Current Commands

Relevant commands in `package.json`:

- `pnpm scrape:curated-courts`
- `pnpm db:import:curated-courts`
- `pnpm db:seed:curated-courts`
- `pnpm db:backfill:place-embeddings`
- `pnpm db:backfill:place-embeddings:production`
- `pnpm db:check:curated-duplicates`
- `pnpm db:check:curated-duplicates:production`

## Data Flow

Canonical flow:

1. Gather the source website’s venue-detail URLs.
2. Produce a curated-courts CSV in importer format.
3. Run duplicate preflight against production curated places.
4. Review ambiguous rows manually.
5. Import only approved rows.
6. Re-run place-embedding backfill so the new places participate in future duplicate checks.

The duplicate gate is mandatory for new website imports. Do not import a third-party directory CSV directly into production.

## Required Files and Outputs

For a source site named `<source>`:

- URL list:
  - `scripts/output/<source>-urls.txt`
- source CSV:
  - `scripts/output/<source>-curated-courts.csv`
- duplicate outputs:
  - `scripts/output/<source>-curated-courts.approved.csv`
  - `scripts/output/<source>-curated-courts.duplicates.csv`
  - `scripts/output/<source>-curated-courts.review.csv`
  - `scripts/output/<source>-curated-courts.dedupe-report.json`

Keep the original source CSV. It is the audit input for later threshold tuning.

## Source Website to CSV

### Preferred path

Use the generic scraper when the site fits the existing extraction assumptions:

```bash
pnpm scrape:curated-courts -- \
  --start-url <source-start-url> \
  --urls-file scripts/output/<source>-urls.txt \
  --output scripts/output/<source>-curated-courts.csv \
  --raw-output scripts/output/<source>-curated-courts.raw.json \
  --state scripts/output/<source>-scrape-state.json \
  --coverage-output scripts/output/<source>-coverage.json \
  --skip-db-coverage
```

### Fallback path

If the generic scraper does not yield rows because the site structure is too custom:

1. Discover explicit venue-detail URLs from sitemap, page source, Firecrawl map, or browser inspection.
2. Extract venue records from those detail pages directly.
3. Materialize a CSV that matches `scripts/import-curated-courts.ts`.

Required importer columns:

- `name`
- `address`
- `city`
- `province`
- `country`
- `time_zone`
- `latitude`
- `longitude`
- `facebook_url`
- `instagram_url`
- `viber_contact`
- `website_url`
- `other_contact_info`
- `amenities`
- `courts`
- `photo_urls`

Notes:

- `country` will be forced to `PH` on import.
- `time_zone` will be forced to `Asia/Manila` on import.
- `courts` must use importer format, e.g. `Court 1|pickleball|;Court 2|pickleball|`.

## Duplicate Preflight

Run duplicate preflight against production before any production import:

```bash
pnpm db:check:curated-duplicates:production -- \
  --file scripts/output/<source>-curated-courts.csv
```

This script:

- embeds each incoming row using the same OpenAI model used for stored place embeddings
- compares against existing `CURATED` places plus `place_embedding`
- writes four outputs:
  - approved CSV
  - duplicate CSV
  - review CSV
  - JSON report

### Decision meanings

- `approved`
  - safe to import
- `duplicate`
  - already represented in production; do not import
- `review`
  - ambiguous; requires manual adjudication
- `invalid`
  - source CSV row is malformed and must be fixed before import

### Manual review rules

When a row lands in `review`, inspect:

- venue name variant vs existing curated place
- city and province
- address overlap
- shared phone, Viber, Facebook, Instagram, or website
- whether the source is a branch rename vs a genuinely new venue

If approved manually, move that row into the approved CSV and rerun `db:import:curated-courts -- --dry-run`.

## Import

Always dry-run the approved CSV first:

```bash
pnpm db:import:curated-courts -- \
  --file scripts/output/<source>-curated-courts.approved.csv \
  --dry-run
```

If the dry run is clean, import to production:

```bash
pnpm exec dotenvx run --env-file=.env.production -- \
  tsx scripts/import-curated-courts.ts \
  --file scripts/output/<source>-curated-courts.approved.csv
```

Do not use `db:seed:curated-courts` for a one-off new source until the source CSV has passed duplicate preflight.

## Embedding Backfill

After production import, refresh place embeddings:

```bash
pnpm db:backfill:place-embeddings:production
```

Why:

- new curated places must immediately join the semantic duplicate set
- the next source import should compare against the latest production state

## Production Runbook

Repeat this exact sequence for each new site:

1. Build `scripts/output/<source>-urls.txt`
2. Produce `scripts/output/<source>-curated-courts.csv`
3. `pnpm db:check:curated-duplicates:production -- --file scripts/output/<source>-curated-courts.csv`
4. Review `scripts/output/<source>-curated-courts.review.csv`
5. `pnpm db:import:curated-courts -- --file scripts/output/<source>-curated-courts.approved.csv --dry-run`
6. Production import of approved rows only
7. `pnpm db:backfill:place-embeddings:production`

## Cebu Example

The `cebupickleballcourts.com` ingestion followed this pattern.

Artifacts:

- `scripts/output/cebupickleballcourts-urls.txt`
- `scripts/output/cebupickleballcourts-curated-courts.csv`
- `scripts/output/cebupickleballcourts-curated-courts.approved.csv`
- `scripts/output/cebupickleballcourts-curated-courts.duplicates.csv`
- `scripts/output/cebupickleballcourts-curated-courts.review.csv`
- `scripts/output/cebupickleballcourts-curated-courts.dedupe-report.json`

Observed result after running production duplicate checks and import:

- most source rows mapped to existing curated venues
- only a small approved subset was imported
- embeddings were backfilled again immediately after import

## Guardrails

- Keep embeddings private and out of route payloads.
- Keep the source CSV and the dedupe report for auditability.
- Tune duplicate thresholds only after inspecting false positives or false negatives in real reports.
- If a website reuses one social profile across multiple venues, do not rely on social URL match alone; confirm with name, location, and semantic score.
