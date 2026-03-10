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
- more Bulacan urban centers
- more Rizal suburban/club-heavy areas
- more Negros Oriental municipalities adjacent to Dumaguete/Dauin/Bacong
- more Iloilo municipalities adjacent to known venue clusters
4. Use `run-report.json` as the source of truth for whether a scope actually imported, skipped, or failed.

## Resume Checklist

When resuming later:

1. Read this file.
2. Inspect recent scope artifacts under `scripts/output/discovery/pickleball/**/run-report.json`.
3. Continue with:

```bash
pnpm scrape:curated:run -- --province <province-slug> --city <city-slug>
```

4. After any run, verify the `run-report.json` instead of trusting console output alone.
