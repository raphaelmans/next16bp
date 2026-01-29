# AI Normalization Testing

## Overview

Tiered test suite for the booking import AI normalization pipeline. Covers CSV, ICS, and screenshot (image) inputs with deterministic tiers for regression and a blackbox tier for AI mapping.

## Directory Structure

```
scripts/
├── fixtures/normalize-data/
│   ├── tier0/                    # Happy path
│   │   ├── <name>.csv|.ics
│   │   ├── <name>-mapping.json
│   │   └── <name>-expected.json
│   ├── tier1/                    # Whitebox edge cases
│   │   ├── <name>.csv|.ics
│   │   ├── <name>-mapping.json
│   │   ├── <name>-expected.json
│   │   └── promoted/            # Tier 3 failures promoted here
│   ├── tier2/                    # Screenshot fixtures (manually created)
│   │   ├── <name>.jpeg|.png
│   │   ├── <name>-extracted.json
│   │   └── <name>-expected.json
│   └── tier3/                    # Blackbox human-readable
│       ├── <name>.csv|.ics
│       └── <name>-expected.json  # (no mapping - AI generates it)
├── test-normalize-harness.ts     # Shared comparison + runner utilities
├── test-tier0-normalize.ts
├── test-tier1-normalize.ts
├── test-tier2-normalize.ts
├── test-tier3-normalize.ts
└── gen-tier-fixtures.ts          # Generates tier0 + tier1 fixture files
```

## Scripts

```
pnpm script:gen-tier-fixtures
pnpm script:test-tier0
pnpm script:test-tier1
pnpm script:test-tier2
pnpm script:test-tier3
pnpm script:test-all-tiers
pnpm script:promote-tier3 --case=<name>
```

Notes:
- Tier 0/1/2 are deterministic and do not require an API key.
- Tier 3 requires `OPENAI_API_KEY`.
- All scripts use `dotenvx run --env-file=.env.local` in `package.json`.

## Execution Order

1. Generate fixtures
   - `pnpm script:gen-tier-fixtures`
2. Run deterministic tiers
   - `pnpm script:test-tier0`
   - `pnpm script:test-tier1`
3. Run screenshot tier (after manual fixtures exist)
   - `pnpm script:test-tier2`
4. Run blackbox AI tier
   - `pnpm script:test-tier3`
5. Optional full run
   - `pnpm script:test-all-tiers`
6. Promote Tier 3 failures into Tier 1
   - `pnpm script:promote-tier3 --case=<name>`

## Tier Behavior

### Tier 0 - Happy Path
- Clean CSV/ICS with known mappings.
- Runner uses `--no-ai --mapping-file`.

### Tier 1 - Whitebox Edge Cases
- CSV/ICS fixtures crafted for edge cases (date formats, timezone handling, mapping, parsing).
- Runner uses `--no-ai --mapping-file`.
- `tier1/promoted` is included automatically.

### Tier 2 - Screenshot Path
- Screenshot-based inputs with pre-extracted JSON.
- Runner uses `--format=image --extracted-file --no-ai`.
- Matching is relaxed with time tolerance.

### Tier 3 - Blackbox Human-Readable
- Hand-crafted CSV/ICS with unusual but readable patterns.
- No mapping file; AI must infer the mapping.
- Runner saves mapping on failure for promotion.

## Manual Steps for Tier 2 Fixtures

1. Import a Tier 1 ICS file into Google Calendar / Apple Calendar.
2. Screenshot the calendar view.
3. Run image normalization once to extract JSON:

```
pnpm script:normalize-data -- --format=image --path=<screenshot>
```

4. Save the extracted JSON as `tier2/<name>-extracted.json`.
5. Create `tier2/<name>-expected.json` based on known input data.

## Tier 3 Fixture Categories (Examples)

- Non-English headers (French/Spanish/German)
- Alternate delimiters (pipe, tab)
- Text dates (February 1, 2026)
- European time notation (9h00, 9.00)
- Combined fields (Court 1 - 9:00 to 11:00)
- Excel serial date numbers

## Verification

- `pnpm script:test-all-tiers` passes
- `pnpm lint` passes
- `TZ=UTC pnpm build` passes
