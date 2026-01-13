# [00-19] Owner Reservation Audit UX

# [00-19] Owner Reservation Audit UX

> Date: 2026-01-13
> Previous: 00-18-owner-slot-prereqs.md

## Summary

Fixed owner reservations filtering reliability and improved owner-facing status clarity with audit timelines. Normalized timestamp serialization to prevent API errors, added place-level filtering server-side, and aligned owner UI labels with reservation workflow stages.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/modules/reservation/dtos/reservation-owner.dto.ts` | Added `placeId` filter to owner reservation input schema. |
| `src/modules/reservation/repositories/reservation.repository.ts` | Added place filter + compatible slot join; normalized timestamps to ISO. |
| `src/modules/time-slot/repositories/time-slot.repository.ts` | Normalized reservation expiry timestamps to ISO. |
| `src/features/owner/hooks/use-owner-reservations.ts` | Pass `placeId` into owner reservation query. |
| `src/features/owner/hooks/use-reservation-alerts.ts` | Accept place filter for alerts. |
| `src/features/owner/components/reservation-alerts-panel.tsx` | Stage-aware labels + action labels in alerts panel. |
| `src/app/(owner)/owner/reservations/page.tsx` | Removed client-side place/court filtering fallback. |
| `src/app/(owner)/owner/reservations/active/page.tsx` | Pass place filter and simplify active filtering. |
| `src/features/owner/components/reservations-table.tsx` | Stage labels in Status column + action gating by stage. |
| `src/app/(owner)/owner/reservations/[id]/page.tsx` | Added audit timeline from `audit.reservationHistory`. |
| `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` | Guard `latitude/longitude` parsing for null values. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/14-place-court-migration/14-07-owner-reservations-place-filtering.md` | Impact analysis and plan for place filter + counts. |
| `agent-plans/14-place-court-migration/14-08-owner-reservation-status-audit.md` | Plan for stage labels + audit timeline UX. |

## Key Decisions

- Owner reservation lists must use workflow stages (`CREATED`, `AWAITING_PAYMENT`, etc.) rather than coarse “pending”.
- Owner reservation details should show full `reservation_event` audit history.
- Server-side place filtering avoids client-side race conditions.

## Next Steps

- [ ] Optionally make `getPendingCount` filter-aware (placeId/courtId) to align badge counts with filtered views.
- [ ] Revisit player-side activity labels if you want parity with owner stage labels.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
