# [01-37] Import Replace with Guest Booking

> Date: 2026-01-30
> Previous: 01-36-week-timeline-union.md

## Summary

Implemented the "Replace with Guest Booking" feature for the bookings import module. After an import is committed (creating MAINTENANCE court blocks), owners can now replace individual imported blocks with proper guest reservations. The replacement is atomic — a single transaction creates the reservation, cancels the block, and marks the import row as replaced.

## Changes Made

### Schema

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/bookings-import-row.ts` | Added `replacedWithReservationId` (FK → reservation), `replacedWithGuestProfileId` (FK → guest_profile), `replacedAt` columns |

### Backend - DTOs & Errors

| File | Change |
|------|--------|
| `src/modules/bookings-import/dtos/replace-with-guest.dto.ts` | New Zod schema: `rowId`, `guestMode` (existing/new), guest fields, notes. Includes refine for mode-specific validation |
| `src/modules/bookings-import/dtos/index.ts` | Added exports for new DTO |
| `src/modules/bookings-import/errors/bookings-import.errors.ts` | Added `BookingsImportRowAlreadyReplacedError` (ConflictError), `BookingsImportRowNotCommittedError`, `BookingsImportRowMissingBlockError` (ValidationError) |

### Backend - Service & Wiring

| File | Change |
|------|--------|
| `src/modules/bookings-import/services/bookings-import.service.ts` | Added 5 new constructor deps (guest profile, reservation events, pricing repos). Added `replaceWithGuest()` method with full transaction: verify ownership → guard state → resolve/create guest → compute pricing → overlap check (excluding replaced block) → create CONFIRMED reservation + event → cancel block → mark row replaced |
| `src/modules/bookings-import/factories/bookings-import.factory.ts` | Wired `makeGuestProfileRepository`, `makeReservationEventRepository`, `makeCourtHoursRepository`, `makeCourtRateRuleRepository`, `makeCourtPriceOverrideRepository` |
| `src/modules/bookings-import/bookings-import.router.ts` | Added `replaceWithGuest` protectedProcedure mutation. Added `BookingsImportRowAlreadyReplacedError` to CONFLICT error mapping |

### Frontend - Types & Store

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/types.ts` | Added `courtBlockId`, `replacedWithReservationId`, `replacedAt` to `DraftRowItem` type |
| `src/features/owner/stores/booking-studio-store.ts` | Added `replaceDialogOpen`, `replaceBlockId` state + `openReplaceDialog`, `closeReplaceDialog` actions |

### Frontend - Components

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/timeline-block-item.tsx` | Added `isImported` and `onReplaceWithGuest` props. Shows "Imported" badge and "Replace with guest" button on imported blocks |
| `src/features/owner/components/booking-studio/replace-with-guest-dialog.tsx` | New dialog component: read-only time display, guest mode toggle (existing combobox / new guest form), name prefilled from import row reason, notes field |
| `src/app/(owner)/owner/bookings/page.tsx` | Computed `importedBlockIds`/`replacedBlockIds`/`draftRowsByBlockId` memos. Added replace form + mutation + handler. Passed `isImported`/`onReplaceWithGuest` to `TimelineBlockItem`. Rendered `ReplaceWithGuestDialog`. Enabled guest profiles query for replace dialog |

## Key Decisions

- **Replacement lives in `BookingsImportService`** (not reservation module) — keeps the feature co-located with import logic, even though it crosses module boundaries. The service already used court block and reservation repos.
- **Overlap check excludes the block being replaced** — instead of cancelling the block first (risking orphaned state on reservation failure), we filter it out of overlap results and cancel after successful reservation creation. Transaction rollback handles any failure.
- **Guest creation is inline** — for "new guest" mode, the guest profile is created within the same transaction as the reservation, avoiding a separate mutation round-trip.
- **No new row status** — replacement is tracked via `replacedAt`/`replacedWithReservationId` columns rather than a new status enum, since the row remains `COMMITTED`.

## Next Steps

- [ ] Run `pnpm db:generate` + `pnpm db:migrate` to apply schema migration
- [ ] Optional: Add replacement UI to import review page (`src/app/(owner)/owner/import/bookings/[jobId]/page.tsx`) with per-row replace buttons and "Replaced" badges
- [ ] Optional: Add bulk replacement ergonomics (next/previous imported item navigation)

## Commands to Continue

```bash
# Generate and apply migration for new columns
pnpm db:generate
pnpm db:migrate

# Verify
pnpm lint
pnpm build
```
