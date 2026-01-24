# [01-06] Range Reservations Cutover

> Date: 2026-01-25
> Previous: 01-05-rules-exceptions-cutover.md

## Summary

Removed the legacy time-slot module and migrated reservations + availability to a range-based model (start/end/price), updating both backend endpoints and frontend flows to consume range availability and reservation pricing.

## Changes Made

### Backend (time-slot removal + range reservations)

| File | Change |
|------|--------|
| `src/modules/time-slot/` | Deleted module (DTOs, errors, repo, service, router).
| `src/shared/infra/trpc/root.ts` | Removed time-slot routing and related exports.
| `src/shared/infra/db/schema/time-slot.ts` | Deleted time_slot schema.
| `src/shared/infra/db/schema/reservation-time-slot.ts` | Deleted reservation<->time_slot join schema.
| `src/shared/infra/db/schema/reservation.ts` | Updated reservations to store range fields (start/end) and pricing.
| `src/modules/reservation/` | Refactored create/list/get to work on reservation ranges (DTOs, repository, services, routers).
| `src/modules/availability/` | Updated availability DTO + service to return range availability (start/end/price) for booking.

### Frontend (range booking + availability consumption)

| File | Change |
|------|--------|
| `src/features/reservation/hooks/use-reservation.ts` | Updated to display reservation start/end/price.
| `src/features/reservation/hooks/use-my-reservations.ts` | Updated list mapping to range-based reservation fields.
| `src/app/(auth)/reservations/[id]/page.tsx` | Updated reservation detail UI to render range data.
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Updated payment context to reference reservation range + price.
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Updated schedule page to use availability endpoints instead of slot lists.
| `src/features/discovery/hooks/use-court-detail.ts` | Updated court detail to hydrate schedule/booking with range availability.
| `src/features/owner/*` | Removed slot-specific components/hooks and updated owner pages accordingly.

### Shared / Routing Helpers

| File | Change |
|------|--------|
| `src/shared/lib/app-routes.ts` | Updated route helpers away from slotId-based routes where applicable.
| `src/shared/lib/time-slot-availability.ts` | Deleted legacy helper.
| `src/shared/lib/schedule-availability.ts` | Added range availability helper for schedule rendering.

## Validation

```bash
pnpm lint
TZ=UTC pnpm build
```

## Key Paths Changed/Deleted

- Deleted: `src/modules/time-slot/`
- Deleted: `src/shared/infra/db/schema/time-slot.ts`
- Deleted: `src/shared/infra/db/schema/reservation-time-slot.ts`
- Updated: `src/modules/reservation/reservation.router.ts`
- Updated: `src/modules/reservation/services/reservation.service.ts`
- Updated: `src/modules/availability/services/availability.service.ts`
- Updated: `src/app/(public)/courts/[id]/schedule/page.tsx`
- Updated: `src/app/(auth)/reservations/[id]/page.tsx`

## Next Steps

- Audit for remaining `slotId` / time-slot references and remove any dead UI routes/components.
