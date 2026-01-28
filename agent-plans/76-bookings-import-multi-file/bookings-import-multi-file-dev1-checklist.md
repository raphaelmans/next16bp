# Bookings Import Multi-File - Dev 1 Checklist

## Shared / Contract

- [ ] Update createDraft form contract to accept `files[]` (1..3)
- [ ] Add `bookingsImport.listSources` API contract
- [ ] Add row provenance fields and UI expectations

## Server / Backend

- [ ] Add `bookings_import_source` schema + exports
- [ ] Add migration + backfill for existing jobs/rows
- [ ] Add sources repository + factory wiring
- [ ] Update `createDraft` to upload 1..3 files and create sources
- [ ] Add `listSources` router endpoint
- [ ] Update `discardJob` to delete all source files
- [ ] Refactor `normalize` to:
- [ ] load sources
- [ ] enforce mode rules
- [ ] parse per source
- [ ] merge rows + provenance
- [ ] duplicate detection across sources
- [ ] AI mapping for CSV/XLSX/ICS

## Client / Frontend

- [ ] Update upload UI for up to 3 files
- [ ] Update review UI to show attached files + per-row source column
- [ ] Normalize button logic:
- [ ] images present -> AI only
- [ ] no images -> deterministic + AI (AI gated)

## Verification

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
- [ ] Manual E2E flows from `agent-plans/76-bookings-import-multi-file/76-05-qa.md`
