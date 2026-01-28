# [01-23] Import Court Scope

> Date: 2026-01-28
> Previous: 01-22-sidebar-venue-link.md

## Summary

Added optional single-court selection before bookings import. The chosen court is persisted on the import job and enforced during normalization, review, and commit so all rows map to that court.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/app/(owner)/owner/import/bookings/page.tsx` | Added court scope UI (multi vs single), court select, auto-select single court when only one exists, and passes `selectedCourtId` in FormData. |
| `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx` | Displays court scope in details, locks court editing in row dialog for single-court jobs, and prefers mapped court label in table. |
| `src/modules/bookings-import/dtos/create-bookings-import.dto.ts` | Accepts optional `selectedCourtId` in FormData. |
| `src/modules/bookings-import/errors/bookings-import.errors.ts` | Added invalid-court validation error for court scope. |
| `src/modules/bookings-import/services/bookings-import.service.ts` | Validates selected court, stores it on job metadata, forces it during normalize + commit. |

## Key Decisions

- Single-court selection is an override: when set, all rows are assigned to that court and court editing is locked in review.
- Store selection on job metadata (`metadata.selectedCourtId`) to avoid schema migration.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` if you want a clean lint pass (currently fails due to pre-existing issues outside this change).

## Commands to Continue

```bash
pnpm lint
pnpm build
TZ=UTC pnpm build
```
