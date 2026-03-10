# Manual Import From Leads

## Purpose

This runbook completes the pipeline when discovery has already found leads and the operator needs to carry the scope all the way to production.

Use this especially for:

- Facebook page/profile leads
- Instagram leads
- custom websites where the generic scraper returns weak or partial data

For Facebook-page runs, the default path is no longer purely manual:

- discover leads with Firecrawl
- capture public page text with `playwright-cli`
- generate the import-ready CSV automatically
- only fall back to hand-editing when the capture stage leaves rows in review

The output of this workflow is an import-ready CSV that can pass duplicate preflight and go to production.

This document is an execution runbook, not a planning note.

When this file is explicitly invoked, the operator/agent is expected to execute the workflow end to end for the requested scope, not stop at analysis.

## Standard Operating Unit

Run this workflow one province/city scope at a time.

For Facebook-derived lead discovery, the standard target is:

- `10` stable Facebook page/profile leads per `province / city` combination

Generic scope example:

- `<province-slug> / <city-slug>`

Do not merge multiple province/city scopes into one manual CSV. Keep each scope isolated so duplicate review and import decisions are easy to audit.

## Execution Contract

When this runbook is used for a requested scope:

1. discover or collect the source leads
2. if the source is Facebook, run `playwright-cli` capture to generate the scoped import-ready CSV
3. hand-edit only the rows that still need manual completion
4. run duplicate preflight against production
5. import approved rows to production
6. refresh embeddings
7. verify that new curated records exist in the production database

Do not stop after generating CSV artifacts if the request is to run the pipeline.

## Acceptance Criteria

The run is only complete when all of the following are true:

- approved rows, if any, were imported using the production environment
- `pnpm db:backfill:place-embeddings:production` was run after import
- the operator verified against the production database that the new curated records exist
- the final report includes:
  - scope executed
  - input lead source
  - approved / duplicate / review counts
  - imported row count
  - production verification result

If `.approved.csv` is empty, the run is still considered complete only after the operator explicitly verifies and reports that no new production records were eligible for import.

## Input

You start from one of these:

- `scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages.urls.txt`
- `scripts/output/discovery/<sport>/<province>/<city>/leads.urls.txt`
- any manually curated list of venue/detail URLs

For Facebook-page runs, start with:

```bash
pnpm scrape:curated:discover:facebook -- \
  --province <province-slug> \
  --city <city-slug> \
  --target-count 10
```

Then capture the public page text into CSV candidates:

```bash
pnpm scrape:curated:capture:facebook -- \
  --province <province-slug> \
  --city <city-slug>
```

## Import-Ready CSV Template

Use:

- `scripts/templates/curated-courts-import-ready-template.csv`

This file is already in the importer’s expected shape.

Manual fallback working file:

- `scripts/output/<source>-manual-curated-courts.csv`

Automatic Facebook capture output:

- `scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.csv`

## Canonical Rules

Before filling the CSV:

- `city` and `province` must be canonical values from:
  - `public/assets/files/ph-provinces-cities.enriched.min.json`
- `country` should be `PH`
- `time_zone` should be `Asia/Manila`
- `courts` must use importer format:
  - `Court 1|pickleball|`
  - `Court 1|pickleball|VIP`
  - `Court 1|pickleball|;Court 2|pickleball|`

If the lead source is not reliable enough to confirm a field:

- leave optional fields blank
- do not invent coordinates
- do not invent Instagram/website values

## Field Guide

Required for import:

- `name`
- `address`
- `city`
- `province`
- `courts`

Usually fill if known:

- `facebook_url`
- `instagram_url`
- `viber_contact`
- `website_url`
- `amenities`
- `photo_urls`

Safe amenity examples:

- `Parking`
- `Restrooms`
- `Locker Rooms`
- `Paddle for Rent`
- `Open Play Availability`
- `Indoor`
- `Outdoor`

## Step-by-Step Execution

### 1. Discover Facebook page leads

```bash
pnpm scrape:curated:discover:facebook -- \
  --province <province-slug> \
  --city <city-slug> \
  --target-count 10
```

### 2. Capture the public page text into CSV candidates

```bash
pnpm scrape:curated:capture:facebook -- \
  --province <province-slug> \
  --city <city-slug>
```

Scoped Facebook artifacts:

- `facebook-pages.urls.txt`
- `facebook-pages.captured.json`
- `facebook-pages.capture-state.json`
- `facebook-pages-curated-courts.csv`
- `facebook-pages.capture-report.json`

### 3. If needed, copy the template for manual completion

```bash
cp scripts/templates/curated-courts-import-ready-template.csv \
  scripts/output/<source>-manual-curated-courts.csv
```

### 4. Replace or append real venue rows only if capture left gaps

Use canonical city/province values and importer-ready `courts` strings.

Suggested workflow while filling:

1. copy the template into `scripts/output/<source>-manual-curated-courts.csv`
2. replace the example row with real venue rows
3. keep one row per venue
4. save often and validate with the production duplicate check
5. complete one scope fully before moving to the next scope

### 5. Run duplicate preflight

```bash
pnpm db:check:curated-duplicates:production -- \
  --file scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.csv
```

Outputs:

- `.approved.csv`
- `.duplicates.csv`
- `.review.csv`
- `.dedupe-report.json`

Expected artifact paths:

- `scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.approved.csv`
- `scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.duplicates.csv`
- `scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.review.csv`
- `scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.dedupe-report.json`

### 6. Review ambiguous rows

If any rows land in `.review.csv`:

- check if they are true duplicates
- if they are new venues, copy them into the approved CSV manually

### 7. Dry-run import the approved CSV

```bash
pnpm db:import:curated-courts -- \
  --file scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.approved.csv \
  --dry-run
```

### 8. Import to production

```bash
pnpm exec dotenvx run --env-file=.env.production -- \
  tsx scripts/import-curated-courts.ts \
  --file scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.approved.csv
```

### 9. Refresh embeddings

```bash
pnpm db:backfill:place-embeddings:production
```

### 10. Verify production records exist

After import, verify against the production database, not just local files.

Minimum verification methods:

- production duplicate report/import summary references the created rows
- production export/query confirms the new curated places exist

Example verification command:

```bash
pnpm exec dotenvx run --env-file=.env.production -- \
  tsx scripts/export-curated-places.ts --output scripts/output/<source>-production-export.csv
```

Then confirm the imported place names are present in the production export.

## Production Push Sequence

This is the exact operator sequence after you finish the CSV:

```bash
# 1. duplicate preflight against production
pnpm db:check:curated-duplicates:production -- \
  --file scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.csv

# 2. dry-run only the approved rows
pnpm db:import:curated-courts -- \
  --file scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.approved.csv \
  --dry-run

# 3. import approved rows to production
pnpm exec dotenvx run --env-file=.env.production -- \
  tsx scripts/import-curated-courts.ts \
  --file scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-pages-curated-courts.approved.csv

# 4. refresh embeddings so future duplicate checks include the new rows
pnpm db:backfill:place-embeddings:production

# 5. verify imported rows exist in production
pnpm exec dotenvx run --env-file=.env.production -- \
  tsx scripts/export-curated-places.ts --output scripts/output/<source>-production-export.csv
```

If `.review.csv` contains rows:

- stop before production import
- review the rows manually
- only move truly new venues into the approved CSV
- rerun the dry-run import

If `.approved.csv` is empty:

- do not import
- the source likely mapped entirely to existing curated places

## Fast Checklist

- [ ] CSV built from `curated-courts-import-ready-template.csv`
- [ ] City and province are canonical
- [ ] Duplicate preflight completed
- [ ] Approved CSV dry-run validated
- [ ] Production import executed only for approved rows
- [ ] Embeddings backfilled after import
 - [ ] Production database verification completed

## Common Output Files

After a successful manual-import run, expect these files:

- `scripts/output/<source>-manual-curated-courts.csv`
- `scripts/output/<source>-manual-curated-courts.approved.csv`
- `scripts/output/<source>-manual-curated-courts.duplicates.csv`
- `scripts/output/<source>-manual-curated-courts.review.csv`
- `scripts/output/<source>-manual-curated-courts.dedupe-report.json`

## Notes for Facebook Leads

For Facebook-derived rows:

- use the Facebook page URL in `facebook_url`
- resolve venue name and address manually from the page/profile or from corroborating public sources
- prefer official site or booking page in `website_url` if one exists
- if Facebook is the only source, keep `website_url` blank
- do not treat Facebook posts/groups/reels as the venue URL; use stable page/profile URLs only
- target up to `10` stable pages/profiles per province/city scope, but import only the rows that survive duplicate preflight

## Scope Queue Example

When this runbook is used for a batch, run each scope independently, using the full end-to-end contract above.
