# Normalize Data Fixtures

Sample fixtures for `scripts/normalize-data.ts`.

## CSV (single court)

```bash
pnpm script:normalize-data -- --format=csv --path="scripts/fixtures/normalize-data/booking-single-court.csv" --mapping-file="scripts/fixtures/normalize-data/booking-single-court-mapping.json" --no-ai
```

## CSV (multi-court)

```bash
pnpm script:normalize-data -- --format=csv --path="scripts/fixtures/normalize-data/booking-multi-court.csv" --mapping-file="scripts/fixtures/normalize-data/booking-multi-court-mapping.json" --no-ai
```

## ICS (multi-court)

```bash
pnpm script:normalize-data -- --format=ics --path="scripts/fixtures/normalize-data/booking-multi-court.ics" --mapping-file="scripts/fixtures/normalize-data/booking-ics-mapping.json" --no-ai
```

## CSV (invalid hour alignment)

```bash
pnpm script:normalize-data -- --format=csv --path="scripts/fixtures/normalize-data/booking-invalid.csv" --mapping-file="scripts/fixtures/normalize-data/booking-multi-court-mapping.json" --no-ai
```

## Image (calendar screenshot)

```bash
pnpm script:normalize-data -- --format=image --path="/abs/path/to/calendar.png" --save-extracted-file="/tmp/calendar-extracted.json"
pnpm script:normalize-data -- --format=image --path="/abs/path/to/calendar.png" --extracted-file="/tmp/calendar-extracted.json" --no-ai
```

## AI normalization fixtures

### CSV (AI mapping)

```bash
pnpm script:normalize-data -- --format=csv --path="scripts/fixtures/normalize-data/booking-multi-court.csv" --save-mapping-file="scripts/fixtures/normalize-data/booking-multi-court-ai-mapping.json"
```

### XLSX (AI mapping)

```bash
pnpm script:normalize-data -- --format=xlsx --path="scripts/fixtures/normalize-data/booking-ai.xlsx" --save-mapping-file="scripts/fixtures/normalize-data/booking-ai-xlsx-mapping.json"
```

### ICS (AI mapping)

```bash
pnpm script:normalize-data -- --format=ics --path="scripts/fixtures/normalize-data/booking-ai.ics" --range-start="2025-05-01T00:00:00Z" --range-end="2025-05-31T23:59:59Z" --save-mapping-file="scripts/fixtures/normalize-data/booking-ai-ics-mapping.json"
```

## Contract test (batch reservation blocks)

```bash
pnpm script:contract-test-normalize-data
```
