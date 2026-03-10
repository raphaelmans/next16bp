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

- Current production curated export row count: `412`
- Verified from:
  - [curated-places-export.csv](/home/raphaelm/kudoscourts/scripts/output/curated-places-export.csv)
- Current URL-trace frontier vs Facebook frontier:
  - URL traces: `130`
  - Facebook run-states: `130`
  - Pending relative to URL traces: `0`

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
  - [curated-facebook-ingestion-runner.service.ts](/home/raphaelm/kudoscourts/src/lib/modules/automations/curated-ingestion/services/curated-facebook-ingestion-runner.service.ts)
- The active Facebook capture code is:
  - [curated-facebook-page-capture.service.ts](/home/raphaelm/kudoscourts/src/lib/modules/automations/curated-ingestion/services/curated-facebook-page-capture.service.ts)

## Important Fixes Already Made

1. Facebook runner now supports artifact-driven scope selection:
- `--scope-source configured|artifact:url|artifact:facebook`

2. Empty capture CSVs no longer count as hard failures:
- they are marked `skipped`

3. Facebook capture now uses direct Playwright instead of shelling out to `playwright-cli`:
- avoids missing-CLI setup failures in fresh environments
- uses persistent Playwright user-data dirs under `.playwright-facebook/`
- prefers Chrome when available and falls back to bundled Chromium automatically

4. Generated cache cleanup was required once:
- `.next`
- `.playwright-facebook`
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

10-batch continuation from the `397` baseline to the `412` baseline:

- `Linkers Pickleball Court`
- `Golden Pickle Court`
- `PCKLD Pickleball Cafe`
- `DoPickle Court`
- `LM Pickleball Court`
- `Picklerz Place`
- `CurveSide Pickleball and Cafe`
- `Suncoast Pickleball Club`
- `Hambalos Pickleball Court`
- `Court Hive by Reyes`
- `The 33rd Athletics`
- `Sta Cruz Pickleball Club`

## Current Pending Facebook Scopes

- Relative to current URL traces, there are no pending Facebook scopes.
- The original `11` missing scopes from the prior checkpoint are all complete.
- Broader frontier coverage is now `130 / 130` URL-trace-to-Facebook-run-state parity.

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

- [curated-places-export.csv](/home/raphaelm/kudoscourts/scripts/output/curated-places-export.csv)

Representative Facebook run states:

- [bustos facebook-run-state.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/pickleball/bulacan/bustos/facebook-run-state.json)
- [cebu-city facebook-run-state.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/pickleball/cebu/cebu-city/facebook-run-state.json)
- [mabinay facebook-run-state.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/pickleball/negros-oriental/mabinay/facebook-run-state.json)
- [santa-catalina facebook-run-state.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/pickleball/negros-oriental/santa-catalina/facebook-run-state.json)
- [siaton facebook-run-state.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/pickleball/negros-oriental/siaton/facebook-run-state.json)
- [nasugbu facebook-run-state.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/pickleball/batangas/nasugbu/facebook-run-state.json)
- [santa-cruz facebook-run-state.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/pickleball/laguna/santa-cruz/facebook-run-state.json)
- [bayawan-city-tulong facebook-run-state.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/pickleball/negros-oriental/bayawan-city-tulong/facebook-run-state.json)

10-batch run artifacts:

- [batch-runs 20260310-225106](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/batch-runs/20260310-225106)
- [batch-1-summary.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/batch-runs/20260310-225106/batch-1-summary.json)
- [batch-10-summary.json](/home/raphaelm/kudoscourts/scripts/output/discovery-facebook/batch-runs/20260310-225106/batch-10-summary.json)

## Resume Strategy

If resuming later, do this in order:

1. Read this file.
2. Confirm current production row count from:
- [curated-places-export.csv](/home/raphaelm/kudoscourts/scripts/output/curated-places-export.csv)
3. Recompute pending scopes from URL traces.
4. If pending scopes are non-zero, continue with:

```bash
pnpm scrape:curated:run:facebook -- --scope-source artifact:url
```

5. If pending scopes are already `0`:
- no Facebook runner work is required
- only resume if new URL-trace scopes are added upstream

6. If the runner becomes low-yield:
- inspect existing `facebook-pages.capture-report.json`
- inspect `facebook-pages.captured.json`
- promote clearly distinct review-band rows into a temporary CSV
- run `pnpm db:check:curated-duplicates:production -- --file <temp.csv>`
- import only the approved rows

## Practical Goal For Next Resume

- Continue from the `412` production baseline
- Treat Facebook URL-trace coverage as complete unless new URL scopes appear
- Prefer incremental reruns only after new upstream URL traces are generated
