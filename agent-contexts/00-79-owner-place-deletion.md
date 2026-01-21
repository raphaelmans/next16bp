# [00-79] Owner Place Deletion

> Date: 2026-01-21
> Previous: 00-78-organization-logo-visibility.md

## Summary

Added owner place deletion planning artifacts and implemented delete-place functionality that detaches courts (place_id set null) to preserve reservation audit data, with a confirmed delete flow in the owner edit page.

## Changes Made

### Planning

| File | Change |
|------|--------|
| `agent-plans/user-stories/02-court-creation/02-09-owner-deletes-place.md` | Added user story for owner delete place flow. |
| `agent-plans/user-stories/02-court-creation/02-00-overview.md` | Updated story index and counts. |
| `agent-plans/context.md` | Logged new plan and story addition. |
| `agent-plans/52-owner-place-deletion/52-00-overview.md` | Added master plan overview. |
| `agent-plans/52-owner-place-deletion/52-01-data-model.md` | Added data model phase plan. |
| `agent-plans/52-owner-place-deletion/52-02-backend-api.md` | Added backend API phase plan. |
| `agent-plans/52-owner-place-deletion/52-03-owner-ui.md` | Added owner UI phase plan. |
| `agent-plans/52-owner-place-deletion/owner-place-deletion-dev1-checklist.md` | Added developer checklist. |

### Data Model

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/court.ts` | Made `placeId` nullable and set FK to `ON DELETE SET NULL`. |
| `drizzle/0005_detach_court_place.sql` | Added migration to detach courts on place delete. |

### Backend

| File | Change |
|------|--------|
| `src/modules/place/dtos/place.dto.ts` | Added delete place schema + DTO. |
| `src/modules/place/repositories/place.repository.ts` | Added delete method. |
| `src/modules/place/services/place-management.service.ts` | Added deletePlace service with logging. |
| `src/modules/place/place-management.router.ts` | Added delete mutation endpoint. |
| `src/modules/availability/services/availability.service.ts` | Guarded null `court.placeId`. |
| `src/modules/court/services/court-management.service.ts` | Guarded null `court.placeId`. |
| `src/modules/court-rate-rule/services/court-rate-rule.service.ts` | Added placeId guard for ownership checks. |
| `src/modules/court-hours/services/court-hours.service.ts` | Added placeId guard for ownership checks. |
| `src/modules/reservation/services/reservation.service.ts` | Added placeId guard to reservation flows. |
| `src/modules/reservation/services/reservation-owner.service.ts` | Added placeId guard to owner flows. |
| `src/modules/time-slot/services/time-slot.service.ts` | Added placeId guard for ownership checks. |

### Frontend

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` | Added danger-zone delete dialog with confirmation + mutation. |
| `src/features/discovery/hooks/use-court-detail.ts` | Allowed nullable `placeId` in hook data. |

## Key Decisions

- Detach courts (`ON DELETE SET NULL`) instead of cascading deletes to keep reservations for audit.
- Skip storage object cleanup to avoid bucket side effects.

## Next Steps

- [ ] Run `pnpm lint` and `pnpm build` to validate.
- [ ] Apply migration with `pnpm db:migrate` when ready.

## Commands to Continue

```bash
pnpm lint
pnpm build
pnpm db:migrate
```
