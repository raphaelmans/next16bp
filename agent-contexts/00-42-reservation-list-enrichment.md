# [00-42] Reservation List Enrichment

> Date: 2026-01-14
> Previous: 00-41-payment-method-reminders.md

## Summary

Added a player-facing reservation list endpoint with joined place/court/slot data and wired the My Reservations list + home summary to show real values (no placeholders). Added user stories and an implementation plan for the enrichment work.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/reservation/dtos/reservation-list.dto.ts` | Added DTO schema for enriched reservation list items. |
| `src/modules/reservation/dtos/index.ts` | Exported reservation list DTOs. |
| `src/modules/reservation/repositories/reservation.repository.ts` | Added `findWithDetailsByPlayerId` with joins, slot aggregation, and first place photo selection. |
| `src/modules/reservation/services/reservation.service.ts` | Added `getMyReservationsWithDetails` service method. |
| `src/modules/reservation/reservation.router.ts` | Added `reservation.getMyWithDetails` endpoint. |

### Frontend

| File | Change |
|------|--------|
| `src/features/reservation/hooks/use-my-reservations.ts` | Switched to `getMyWithDetails`, added filtering/sorting and removed placeholders. |
| `src/features/home/hooks/use-home-data.ts` | Fetch upcoming reservations with `getMyWithDetails`. |
| `src/app/(auth)/home/page.tsx` | Render upcoming reservations with real court/address details. |
| `src/features/reservation/hooks/use-cancel-reservation.ts` | Invalidate `getMyWithDetails` cache on cancel. |
| `src/features/reservation/hooks/use-mark-payment.ts` | Invalidate `getMyWithDetails` cache on payment. |
| `src/features/reservation/hooks/use-upload-payment-proof.ts` | Invalidate `getMyWithDetails` cache on proof upload. |
| `src/features/reservation/hooks/use-create-reservation.ts` | Invalidate `getMyWithDetails` cache on create. |
| `src/features/reservation/hooks/use-create-reservation-for-court.ts` | Invalidate `getMyWithDetails` cache on create. |
| `src/features/reservation/hooks/use-create-reservation-for-any-court.ts` | Invalidate `getMyWithDetails` cache on create. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/context.md` | Added reservation list enrichment references. |
| `agent-plans/user-stories/16-reservation-list-enrichment/16-00-overview.md` | Added reservation list enrichment story overview. |
| `agent-plans/user-stories/16-reservation-list-enrichment/16-01-player-views-reservation-list-with-accurate-details.md` | Added My Reservations list story. |
| `agent-plans/user-stories/16-reservation-list-enrichment/16-02-player-sees-upcoming-reservation-summary.md` | Added home summary story. |
| `agent-plans/30-reservation-list-enrichment/30-00-overview.md` | Added implementation master plan. |
| `agent-plans/30-reservation-list-enrichment/30-01-backend-list-endpoint.md` | Added backend phase plan. |
| `agent-plans/30-reservation-list-enrichment/30-02-frontend-wiring.md` | Added frontend phase plan. |
| `agent-plans/30-reservation-list-enrichment/reservation-list-enrichment-dev1-checklist.md` | Added dev checklist. |

## Key Decisions

- Use place photos (first by display order) as reservation list cover images to align with detail page behavior.
- Order upcoming reservations by slot start time for clearer scheduling.

## Next Steps (if applicable)

- [ ] Clear existing `pnpm lint` warnings in `agent-plans/user-stories/generate-checkpoint-html.js` and `src/app/(owner)/owner/settings/page.tsx`.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
