# Facebook Scraper Checkpoint

Last updated: 2026-03-10

## Purpose

This session note captures the state of the Facebook-page ingestion pipeline so the next run can resume without re-deriving:

- current production baseline
- what was already imported
- what artifacts/runners exist
- which scopes are still pending
- which operational blockers were already handled

## Current Production State

- Current production curated export row count: `397`
- Verified from:
  - [production-curated-places-latest.csv](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/production-curated-places-latest.csv)

## Canonical Commands

Facebook discovery only:

```bash
pnpm scrape:curated:discover:facebook -- --province <province-slug> --city <city-slug>
```

Facebook capture only:

```bash
pnpm scrape:curated:capture:facebook -- --province <province-slug> --city <city-slug>
```

Facebook production runner:

```bash
pnpm scrape:curated:run:facebook -- --scope-source artifact:url
```

Single-scope Facebook runner:

```bash
pnpm scrape:curated:run:facebook -- --province <province-slug> --city <city-slug> --scope-source artifact:url
```

## Source of Truth

- Scope frontier is no longer just the static configured list.
- Facebook runner follows URL-run traces by default:
  - URL traces: `scripts/output/discovery/**/run-state.json`
  - Facebook traces: `scripts/output/discovery-facebook/**/facebook-run-state.json`
- The active Facebook runner code is:
  - [curated-facebook-ingestion-runner.service.ts](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/automations/curated-ingestion/services/curated-facebook-ingestion-runner.service.ts)
- The active Facebook capture code is:
  - [curated-facebook-page-capture.service.ts](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/automations/curated-ingestion/services/curated-facebook-page-capture.service.ts)

## Important Fixes Already Made

1. Facebook runner now supports artifact-driven scope selection:
- `--scope-source configured|artifact:url|artifact:facebook`

2. Empty capture CSVs no longer count as hard failures:
- they are marked `skipped`

3. `playwright-cli` calls now have a timeout:
- prevents hanging forever on bad Facebook pages

4. Generated cache cleanup was required once:
- `.next`
- `.playwright-cli`
- `playwright-report`
- `tsconfig.tsbuildinfo`

## Verified Production Imports From Facebook Pipeline

Earlier session imports:

- `Welcome Pickleball Club`
- `Maries Village Pickleball Court & Clubhouse`
- `Pickle Hive`
- `Davao City Pickleball Club Inc.`
- `Paddle Up Davao - Pickleball Court`
- `PicklePoint Iloilo`
- `YMCA Baguio Pickleball`
- `Baguio Tennis and Pickleball Court`
- `Sunny Sideout`
- `The Pickler’s Hideout`
- `Olive Grove Pickleball`
- `Tanya’s 11th Street Complex`
- `Olobamas Pickleball Club`
- `The Picklezone Leisure Hub`
- `Drop & Drive Pickleball Camp`
- `Eagle Ridge Sports Clubhouse`
- `Biñan Laguna Pickleball`
- `The GRAND LINE`
- `PCPH Pampanga (Pickleball Central Philippines)`
- `Pickl'd Philippines`
- `Batangas Pickleball Arena`
- `EJ's Pickleball Lounge`
- `Sundown Pickleball Court`

Most recent completed batch from the `385` baseline to the `397` baseline:

- `The Pickle Pad`
- `Mighty Sports Center Bulacan`
- `Swoosh Sports Club`
- `Powerhouse Pickleball and Badminton Center`
- `Dink Central PH`
- `KabKad Paddle Stackers`
- `Palmside Court`
- `Palm&Paddle`
- `Prestige Pickleball Club`
- `Pickleball World`
- `Pampanga Pickleball Center`
- `Courtside Pickleball`
- `ACE covered Pickleball COURT`

Notes:
- `ACE covered Pickleball COURT` was a manual promotion from the duplicate gate’s review band.
- All listed imports were production-verified and embedding-backfilled.

## Current Pending Facebook Scopes

The remaining unresolved Facebook scopes relative to URL traces are:

- `bulacan / bustos`
- `bulacan / calumpit`
- `bulacan / pandi`
- `bulacan / paombong`
- `davao-del-sur / malalag`
- `davao-del-sur / matanao`
- `davao-del-sur / padada`
- `negros-oriental / mabinay`
- `negros-oriental / santa-catalina`
- `negros-oriental / siaton`
- `rizal / teresa`

Count: `11`

These are still `missing` Facebook run-state completions, not just review rows.

## Repeated Failure Patterns

1. Low-yield rural/municipal Facebook scopes
- many complete with `0` import-ready rows
- common outcome:
  - discovery succeeded
  - capture succeeded
  - `csvRowCount = 0`
  - runner marks duplicate/import/db/backfill as `skipped`

2. Facebook page/profile instability
- common errors:
  - `### Error ... not valid JSON`
  - browser profile lock
  - login-wall or route mismatch behavior

3. Transient network failures
- OpenAI DNS:
  - `getaddrinfo ENOTFOUND api.openai.com`
- Supabase pooler DNS:
  - `getaddrinfo ENOTFOUND aws-1-ap-southeast-1.pooler.supabase.com`
- these caused some passes to stop even though the runner logic itself was fine

4. Review-band venues
- some genuinely distinct venues were left in review because of conservative duplicate scoring or coarse addresses
- proven examples:
  - `Pampanga Pickleball Center`
  - `Courtside Pickleball`
  - `ACE covered Pickleball COURT`

## Useful Files When Resuming

Production export:

- [production-curated-places-latest.csv](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/production-curated-places-latest.csv)

Representative Facebook run states:

- [bocaue facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/bulacan/bocaue/facebook-run-state.json)
- [guiguinto facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/bulacan/guiguinto/facebook-run-state.json)
- [silang facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/cavite/silang/facebook-run-state.json)
- [carcar-city facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/cebu/carcar-city/facebook-run-state.json)
- [bacong facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/negros-oriental/bacong/facebook-run-state.json)
- [dauin facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/negros-oriental/dauin/facebook-run-state.json)
- [mabalacat-city facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/pampanga/mabalacat-city/facebook-run-state.json)
- [san-fernando-city facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/pampanga/san-fernando-city/facebook-run-state.json)
- [cainta facebook-run-state.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/pickleball/rizal/cainta/facebook-run-state.json)

Manual promotion artifacts used successfully:

- [final-batch10-promotions.csv](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/final-batch10-promotions.csv)
- [final-batch10-last-row.csv](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/discovery-facebook/final-batch10-last-row.csv)

## Resume Strategy

If resuming later, do this in order:

1. Read this file.
2. Confirm current production row count from:
- [production-curated-places-latest.csv](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/output/production-curated-places-latest.csv)
3. Recompute pending scopes from URL traces.
4. Continue with:

```bash
pnpm scrape:curated:run:facebook -- --scope-source artifact:url
```

5. If the runner becomes low-yield:
- inspect existing `facebook-pages.capture-report.json`
- inspect `facebook-pages.captured.json`
- promote clearly distinct review-band rows into a temporary CSV
- run `pnpm db:check:curated-duplicates:production -- --file <temp.csv>`
- import only the approved rows

## Practical Goal For Next Resume

- Continue from the `397` production baseline
- Work the remaining `11` pending Facebook scopes
- Prefer finishing the missing scopes before broadening further
