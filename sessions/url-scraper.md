# URL Scraper Checkpoint

Last updated: 2026-03-10

## What Was Built

- Curated ingestion now has a resumable e2e production runner:
  - `pnpm scrape:curated:run`
  - wrapper: [scripts/run-curated-ingestion.ts](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/scripts/run-curated-ingestion.ts)
  - service: [curated-ingestion-runner.service.ts](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/automations/curated-ingestion/services/curated-ingestion-runner.service.ts)
- Discovery is host-strategy-driven, not province-specific:
  - search -> map -> scrape/fallback
  - key files:
    - [curated-lead-discovery.service.ts](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/automations/curated-ingestion/services/curated-lead-discovery.service.ts)
    - [lead-source-strategy.ts](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/automations/curated-ingestion/shared/lead-source-strategy.ts)
    - [firecrawl-curated-courts.service.ts](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/automations/curated-ingestion/services/firecrawl-curated-courts.service.ts)
- Place embeddings are active for dedupe:
  - table `place_embedding`
  - model `text-embedding-3-small`
  - backfill script/service already in use
- Importer is hardened:
  - sequential row import
  - DB verification after import
- Runner has a strict scope guard:
  - approved rows are re-resolved against [ph-provinces-cities.enriched.min.json](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/public/assets/files/ph-provinces-cities.enriched.min.json)
  - out-of-scope approved rows are skipped, not imported

## Canonical Defaults

- Configured default scopes remain in:
  - [curated-discovery-scopes.ts](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/automations/curated-ingestion/shared/curated-discovery-scopes.ts)
- Current default configured 10:
  - `metro-manila / quezon-city`
  - `metro-manila / city-of-pasig`
  - `metro-manila / city-of-makati`
  - `metro-manila / city-of-paranaque`
  - `metro-manila / taguig`
  - `cebu / mandaue-city`
  - `cebu / talisay-city`
  - `davao-del-sur / davao-city`
  - `iloilo / iloilo-city`
  - `negros-oriental / dumaguete-city`

## Important Commands

Run one scope:

```bash
pnpm scrape:curated:run -- --province <province-slug> --city <city-slug>
```

Run the configured default batch:

```bash
pnpm scrape:curated:run
```

Useful artifacts for each scope:

- `scripts/output/discovery/pickleball/<province>/<city>/run-report.json`
- `scripts/output/discovery/pickleball/<province>/<city>/run-state.json`
- `scripts/output/discovery/pickleball/<province>/<city>/curated-courts.approved.csv`
- `scripts/output/discovery/pickleball/<province>/<city>/curated-courts.dedupe-report.json`

## Most Recent 10-Scope Batch

Run on: `2026-03-11 00:08 PST`

Selection basis:

- highest-density unprocessed cities inferred from `scripts/output/curated-places-export.csv`

Batch scopes executed:

- `negros-occidental / bacolod-city` -> completed duplicate-only (`0 approved`, `1 duplicate`)
- `bohol / dauis` -> imported `1` new place and left `1` review row
- `bohol / tagbilaran-city` -> completed duplicate-only (`0 approved`, `1 duplicate`, `1 review`)
- `bohol / panglao` -> completed duplicate-only (`0 approved`, `1 duplicate`, `1 review`)
- `leyte / tacloban-city` -> imported `1` new place
- `misamis-oriental / cagayan-de-oro-city` -> imported `3` new places and matched `1` duplicate
- `nueva-ecija / cabanatuan-city` -> completed duplicate-only (`0 approved`, `3 duplicates`)
- `camarines-sur / naga-city` -> completed duplicate-only (`0 approved`, `1 duplicate`)
- `cebu / toledo-city` -> completed duplicate-only (`0 approved`, `1 duplicate`)
- `maguindanao / cotabato-city` -> imported `3` new places

Net result for this batch:

- `8` imported places
- `6` duplicate-only completions
- `3` review rows
- `0` scrape failures

Artifacts:

- `scripts/output/discovery/pickleball/bohol/dauis/run-report.json`
- `scripts/output/discovery/pickleball/leyte/tacloban-city/run-report.json`
- `scripts/output/discovery/pickleball/misamis-oriental/cagayan-de-oro-city/run-report.json`
- `scripts/output/discovery/pickleball/maguindanao/cotabato-city/run-report.json`

## Previous 10-Scope Batch

Run on: `2026-03-10 22:56 PST`

Batch scopes executed:

- `cebu / cebu-city` -> completed duplicate-only (`0 approved`, `1 duplicate`)
- `pampanga / guagua` -> failed at `scrape` with `No candidate URLs after filtering and no fallback rows found`
- `pampanga / lubao` -> failed at `scrape` with `No candidate URLs after filtering and no fallback rows found`
- `pampanga / magalang` -> imported `1` new place
- `pampanga / floridablanca` -> failed at `scrape` with `No candidate URLs after filtering and no fallback rows found`
- `laguna / san-pablo-city` -> imported `1` new place
- `laguna / santa-cruz` -> failed at `scrape` with `No candidate URLs after filtering and no fallback rows found`
- `batangas / tanauan-city` -> failed at `scrape` with `No candidate URLs after filtering and no fallback rows found`
- `batangas / nasugbu` -> imported `1` new place
- `negros-oriental / bayawan-city-tulong` -> completed duplicate-only (`0 approved`, `2 duplicates`)

Net result for this batch:

- `3` imported places
- `2` duplicate-only completions
- `5` scrape failures

Artifacts:

- `scripts/output/discovery/pickleball/pampanga/magalang/run-report.json`
- `scripts/output/discovery/pickleball/laguna/san-pablo-city/run-report.json`
- `scripts/output/discovery/pickleball/batangas/nasugbu/run-report.json`

## Proven Production Outcomes

Verified net-new places created during this session included:

- `Quezon City Sports Club`
- `Dragonsmash`
- `Tiendesitas`
- `Metro South Pickleball Club`
- `Pickletown`
- `Matina Town Square`
- `Flores Village Pickleball`
- `Iloilo Festive Mall Courts`
- `Athletes Point Sports Center`
- `Cpu Gymnasium`
- `Makati Pickleball Club`
- `Conquest Sports`
- `Mariana Multi Purpose Covered Court`
- `The Palms Country Club`
- `Lotus Central Mall`
- `Philippine Baptist Theological Seminary`
- `Nbc Court`
- `Dasmarinas Pickleball`
- `South City Homes Recreation Center`
- `Pickleball Hq`
- `Triple A Sports Center Pickleball Courts At Vista Mall`
- `Sm Center Antipolo Downtown`
- `Kingsville Hills Pickleball Club`
- `Pedci Pickleball Courts`
- `St Francis Covered Court`
- `Mission Hills Clubhouse`
- `Marquee Place Sports Zone`
- `Citywalk Badminton Sports Center`
- `Moncarlo Village Basketball Court`
- `Dauin Sport Park`
- `Pickle Jungle`
- `South Forbes Villas Pickleball`
- `Richmond Angono Tennis Court`
- `Angono Tennis Club`
- `Quest Adventure Camp`
- `Sampaloc Tanay Pickleball Club`
- `Zamboanguita Beach Court`
- `Pototan Pickleball Club`
- `Sm City Baliwag`
- `Tg Residence`
- `Paraiso De Avedad`
- `Pico De Loro Beach And Country Club`
- `Quirmita Pickleball Court`
- `Robinsons North Tacloban`
- `Middleton Pickleball Club`
- `Match Point Sports Center`
- `Xavier Sports And Country Club`
- `Pmo Court`
- `Roadside Pickleball`
- `5th Street Pickleball Court`

## Repeated Failure Patterns

1. Weak-source scrape failures
- Many municipal scopes discover leads but end with:
  - `No candidate URLs after filtering and no fallback rows found`
- These are usually low-signal municipalities with no stable venue/directory pages surfaced by search.

2. Scope-drift from nearby cities
- Search/discovery often finds real venues, but for the wrong nearby city.
- The scope guard now blocks these rows instead of importing them.
- Typical run-report note:
  - `all approved rows were out of scope for <city>, skipped N`

3. Duplicate-heavy regional spillover
- Negros Oriental and Iloilo municipal scopes often resolve to already-known venues.
- These complete cleanly as duplicate-only with `0 approved`.

4. Duplicate-preflight DB query defect
- Some scopes hit a runner/database failure during duplicate preflight.
- Example recurring signature:
  - failed stage: `duplicatePreflight`
- large `select ... from place left join place_contact_detail left join place_embedding ...`
- One confirmed recent case:
  - `iloilo / cabatuan`

5. Historical complete-state / missing-report mismatch
- Some older scopes reconcile to fully completed in `run-state.json` but do not have a `run-report.json`.
- Cause:
  - the runner skips already-complete scopes before writing a fresh report
- Resume implication:
  - when a completed scope has no `run-report.json`, fall back to `run-state.json`

## Current Safety Status

- Safe:
  - sequential production import
  - DB verification after import
  - embedding refresh after verified import
  - scope guard preventing wrong-city pollution
- Not yet fully solved:
  - weak-source municipalities with no scrapeable venue pages
  - duplicate-preflight DB query instability on some scopes

## Docs Updated

- [important/automations/00-curated-ingestion-agent-prompt.md](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/important/automations/00-curated-ingestion-agent-prompt.md)
- [important/automations/02-production-runner-flow.md](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/important/automations/02-production-runner-flow.md)
- [important/automations/03-firecrawl-source-strategy.md](/Users/raphaelm/Documents/Coding/boilerplates/next16bp/important/automations/03-firecrawl-source-strategy.md)

## Best Next Steps

1. Fix the `duplicatePreflight` DB query failure path before widening to more low-signal municipalities.
2. Add stronger host-level extraction for the municipalities that repeatedly discover only neighboring-city venues.
3. Prefer continuing from high-signal adjacent areas first:
- use `scripts/output/curated-places-export.csv` to prioritize high-density unprocessed cities before blind geographic expansion
- review-bearing scopes from the latest batch:
  - `bohol / dauis`
  - `bohol / tagbilaran-city`
  - `bohol / panglao`
- more Pampanga cluster-adjacent cities after `magalang`
- more Laguna / Batangas club-heavy cities after `san-pablo-city` and `nasugbu`
- revisit weak-source scopes only when explicit venue URLs are available for `--urls-file`
4. Use `run-report.json` as the source of truth when it exists; for older completed scopes with no report, inspect `run-state.json`.

## Resume Checklist

When resuming later:

1. Read this file.
2. Inspect recent scope artifacts under `scripts/output/discovery/pickleball/**/run-report.json`.
3. If a historical completed scope has no `run-report.json`, inspect `run-state.json` for final stage status.
4. Continue with:

```bash
pnpm scrape:curated:run -- --province <province-slug> --city <city-slug>
```

5. After any run, verify `run-report.json` instead of trusting console output alone. If no report exists for an older completed scope, use `run-state.json`.
