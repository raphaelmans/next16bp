# [01-10] Bookings Import Wiring

> Date: 2026-01-26
> Previous: 01-09-best-price-court-breakdown.md

## Summary

Wired the owner bookings import page to create draft uploads and display AI usage status, then cleaned up lint issues from unused imports and missing fixture newlines.

## Changes Made

### Frontend

| File | Change |
| --- | --- |
| `src/app/(owner)/owner/import/bookings/page.tsx` | Added tRPC draft upload + AI usage query, uploading state, and status callout for AI availability. |

### Backend

| File | Change |
| --- | --- |
| `src/modules/bookings-import/services/bookings-import.service.ts` | Removed unused `ALLOWED_IMPORT_FILE_TYPES` import to satisfy Biome. |

### Scripts & Fixtures

| File | Change |
| --- | --- |
| `scripts/normalize-data.ts` | Removed unused `generateText` import. |
| `scripts/fixtures/normalize-data/booking-ai-ics-mapping.json` | Added trailing newline for formatter compliance. |
| `scripts/fixtures/normalize-data/booking-ai-xlsx-mapping.json` | Added trailing newline for formatter compliance. |
| `scripts/fixtures/normalize-data/booking-multi-court-ai-mapping.json` | Added trailing newline for formatter compliance. |
| `scripts/fixtures/normalize-data/calendar-screenshot-extracted.json` | Added trailing newline for formatter compliance. |

## Key Decisions

- Upload drafts via `FormData` through `trpc.bookingsImport.createDraft` to align with existing file upload conventions.
- Disable source selection and uploads while the draft mutation is pending to avoid race conditions.

## Next Steps

- [ ] Re-run `pnpm lint` to confirm Biome passes after fixes.
- [ ] Smoke test the bookings import upload flow end-to-end.

## Commands to Continue

```bash
pnpm lint
```
