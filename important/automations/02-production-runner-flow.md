# Production Runner Flow

## Purpose

This runbook documents the canonical end-to-end execution path for curated court ingestion in production.

Use this when the operator should:

- take the configured province/city scope list
- run discovery
- scrape leads
- run duplicate preflight
- import approved rows sequentially
- verify production DB persistence
- refresh embeddings

This is the preferred operational path. Use the lower-level scripts only for debugging or replay.

The runners are now exclusive by source type:

- URL/domain pipeline runner
- Facebook page pipeline runner

They share the same canonical scope list.

## Canonical Commands

URL/domain runner:

```bash
pnpm scrape:curated:run:url
```

Facebook-page runner:

```bash
pnpm scrape:curated:run:facebook
```

The Facebook runner defaults to:

- `--scope-source artifact:url`

That means it derives scopes from URL runner traces under:

- `scripts/output/discovery/**/run-state.json`

Single scope:

```bash
pnpm scrape:curated:run:url -- --province <province-slug> --city <city-slug>
pnpm scrape:curated:run:facebook -- --province <province-slug> --city <city-slug>
```

Override the Facebook scope source if needed:

```bash
pnpm scrape:curated:run:facebook -- --scope-source configured
pnpm scrape:curated:run:facebook -- --scope-source artifact:facebook
```

Local variants:

```bash
pnpm scrape:curated:run:url:local
pnpm scrape:curated:run:facebook:local
```

## Scope Source

The runner reads from:

- `src/lib/modules/automations/curated-ingestion/shared/curated-discovery-scopes.ts`

The configured list should contain only:

- `provinceSlug`
- `citySlug`

The runners inject the default sport slug internally.

This scope list is the single source of truth for both:

- URL-level discovery/scrape/import
- Facebook discovery/capture/import

For reruns, the Facebook runner may use URL traces instead of the configured list so it follows the scopes the URL pipeline has actually touched.

## Stage Order

For each scope, the URL/domain runner executes these stages in order:

1. `discovery`
2. `scrape`
3. `duplicatePreflight`
4. `importApproved`
5. `dbVerification`
6. `embeddingBackfill`

For each scope, the Facebook runner executes these stages in order:

1. `facebookDiscovery`
2. `facebookCapture`
3. `facebookDuplicatePreflight`
4. `facebookImportApproved`
5. `dbVerification`
6. `embeddingBackfill`

## State and Resume Behavior

Each URL/domain scope writes a dedicated run state:

- `scripts/output/discovery/<sport>/<province>/<city>/run-state.json`

Each URL/domain scope also writes a summary report:

- `scripts/output/discovery/<sport>/<province>/<city>/run-report.json`

Each Facebook scope writes a dedicated run state:

- `scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-run-state.json`

Each Facebook scope also writes a summary report:

- `scripts/output/discovery-facebook/<sport>/<province>/<city>/facebook-run-report.json`

The runner reconciles existing artifacts before it runs:

- if a stage is already complete, it skips it
- if a scope is fully complete, it skips the whole scope
- if a prior run stopped mid-scope, it resumes from the first incomplete stage
- if a failed scope exists, later scopes still continue

The runner does not rely on “file exists” alone. It also checks:

- duplicate-preflight report state
- approved CSV contents
- presence of approved rows in `place`
- presence of embeddings for imported place IDs

## Import Contract

Approved rows are imported sequentially, one row at a time.

This is intentional. Do not parallelize production imports.

After each row import:

- the importer verifies the created `place.id` exists in `place`
- the runner verifies the approved row is queryable in the DB
- before import, the runner re-resolves each approved row against `public/assets/files/ph-provinces-cities.enriched.min.json`
- if the normalized row does not match the active scope, it is blocked from import and the approved CSV is narrowed to in-scope rows only

The import stage is not complete until DB verification passes.

## Idempotency Rules

- Completed scopes are skipped on rerun.
- Scopes with `0` approved rows are marked complete with skip semantics.
- Already-imported approved rows are detected and not re-imported.
- Embedding backfill runs only for verified imported place IDs.
- Discovery no longer marks URLs as “done” before scrape actually succeeds.
- Out-of-scope approved rows are skipped instead of being imported into the wrong city/province.

## Operational Outputs

Per URL/domain scope, expect:

- `leads.urls.txt`
- `leads.report.json`
- `leads.state.json`
- `scrape-state.json`
- `curated-courts.csv`
- `curated-courts.raw.json`
- `coverage.json`
- `curated-courts.approved.csv`
- `curated-courts.duplicates.csv`
- `curated-courts.review.csv`
- `curated-courts.dedupe-report.json`
- `run-state.json`
- `run-report.json`

Per Facebook scope, expect:

- `facebook-pages.urls.txt`
- `facebook-pages.report.json`
- `facebook-pages.state.json`
- `facebook-pages.captured.json`
- `facebook-pages.capture-state.json`
- `facebook-pages.capture-report.json`
- `facebook-pages-curated-courts.csv`
- `facebook-pages-curated-courts.approved.csv`
- `facebook-pages-curated-courts.duplicates.csv`
- `facebook-pages-curated-courts.review.csv`
- `facebook-pages-curated-courts.dedupe-report.json`
- `facebook-run-state.json`
- `facebook-run-report.json`

## Failure Handling

If a scope fails:

- the failed stage is recorded in `run-state.json`
- `run-report.json` captures the error
- later scopes continue
- the overall runner exits non-zero at the end if any scope failed

Typical next actions:

- discovery failure: inspect `leads.report.json`
- scrape failure: inspect `scrape-state.json` and source lead URLs
- duplicate review rows: inspect `.review.csv` and `.dedupe-report.json`
- import verification failure: replay missing approved rows one-by-one
