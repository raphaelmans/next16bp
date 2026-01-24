# [01-04] Booking Window (60 Days)

> Date: 2026-01-24
> Previous: 01-03-bulk-slot-best-effort.md

## Summary

Implemented a consistent 60-day booking window across availability reads, reservation creation, and owner slot creation. Updated public booking/schedule UIs and owner bulk slot UI to prevent selecting dates beyond the window. Added planning artifacts for follow-up UX polishing (deep-link clamping + clearer error messaging).

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/lib/booking-window.ts` | Added shared `MAX_BOOKING_WINDOW_DAYS = 60`. |
| `src/modules/availability/dtos/availability.dto.ts` | Increased range cap to 60 days and added server-side validation for day + range endpoints. |
| `src/modules/time-slot/dtos/get-available-slots.dto.ts` | Added range-length cap and lead-time cap for public slot availability. |
| `src/modules/time-slot/dtos/get-slots-for-court.dto.ts` | Added range-length cap for owner slot queries. |
| `src/modules/time-slot/dtos/create-time-slot.dto.ts` | Enforced owner slot creation to be within 60 days. |
| `src/modules/reservation/dtos/create-reservation.dto.ts` | Enforced reservation `startTime` to be within 60 days (court + any-court). |
| `src/modules/reservation/errors/reservation.errors.ts` | Added `BookingWindowExceededError` for a clear domain-level booking window error. |
| `src/modules/reservation/services/reservation.service.ts` | Added booking window guard for all reservation creation paths (including legacy `timeSlotId` flow). |
| `src/features/discovery/components/booking-card.tsx` | Added `maxDate` to date picker based on timezone + 60-day window. |
| `src/app/(public)/places/[placeId]/page.tsx` | Added `maxDate` to date picker for place booking section. |
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Added `maxDate` in day picker and capped month view navigation/selection; clamped month range end to the max. |
| `src/features/owner/components/bulk-slot-modal.tsx` | Capped calendars to <= 60 days and clamped default start/end date when opening the modal. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/63-booking-window-60-days/*` | Created implementation plan for server + client booking window enforcement. |
| `agent-plans/64-booking-window-ux/*` | Created follow-up plan for schedule deep-link clamping + friendlier error messaging (not implemented yet). |
| `agent-plans/context.md` | Logged the new 63 and 64 plans in the changelog. |

## Key Decisions

- Enforce the 60-day window both client-side (UX guardrail) and server-side (prevents bypass and unbounded requests).
- Cap owner slot creation to <= 60 days to reduce `time_slot` growth risk (retention/pruning explicitly deferred).

## Next Steps

- [ ] Implement the UX follow-up plan: `agent-plans/64-booking-window-ux/64-00-overview.md`.
- [ ] (Deferred) Decide on retention/pruning strategy for historical `time_slot` rows.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
