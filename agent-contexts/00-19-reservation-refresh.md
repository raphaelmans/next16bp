# [00-19] Reservation Refresh + Activity Timeline

> Date: 2026-01-13
> Previous: 00-18-owner-slot-prereqs.md

## Summary

Added manual refresh controls for player and owner reservation views, and replaced the player activity card with a full reservation event timeline backed by the audit log. Updated reservation getById to return event history and adjusted the payment page to the new response shape.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/modules/reservation/services/reservation.service.ts` | Return reservation + event history from `getReservationById`. |
| `src/app/(auth)/reservations/[id]/page.tsx` | Added refresh action + event-driven activity timeline UI. |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Adjusted to use `reservationData.reservation`. |
| `src/app/(owner)/owner/reservations/page.tsx` | Added refresh button that invalidates owner reservations + counts. |
| `src/app/(owner)/owner/reservations/active/page.tsx` | Added refresh action with invalidateQueries. |

### Plans

| File | Change |
|------|--------|
| `agent-plans/15-reservation-refresh/15-00-overview.md` | Master plan for refresh + timeline. |
| `agent-plans/15-reservation-refresh/15-01-refresh-activity.md` | Phase 1 implementation details. |
| `agent-plans/15-reservation-refresh/reservation-refresh-dev1-checklist.md` | Developer checklist. |

### Documentation

| File | Change |
|------|--------|
| `docs/reservation-state-machine-diagram.md` | Updated diagram to mutual-confirmation flow. |

## Key Decisions

- Extended `reservation.getById` to include event history, keeping the timeline data in one query.
- Implemented manual refresh via `queryClient.invalidateQueries` to avoid navigation and full reloads.

## Next Steps (if applicable)

- [ ] Fix lint issues reported in `src/app/(owner)/owner/reservations/[id]/page.tsx` and `src/features/owner/components/reservations-table.tsx`.
- [ ] Run `pnpm lint` after fixes.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
