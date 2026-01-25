# [01-08] Owner Court Blocks

> Date: 2026-01-25
> Previous: 01-07-drizzle-date-bind-fix.md

## Summary

Added owner-managed maintenance + walk-in blocks on the availability page, including computed price snapshots for walk-ins, hard overlap prevention, and soft-cancel history for analytics. Extended `court_block` schema + migration and introduced a full court-block module with owner-protected APIs.

## Changes Made

### Schema + Migration

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/enums.ts` | Added `court_block_type` enum. |
| `src/shared/infra/db/schema/court-block.ts` | Added type, revenue snapshot, soft-cancel fields, and duration check. |
| `drizzle/0009_court_block_fields.sql` | Migration for new columns + constraints + exclusion. |

### Backend (Court Blocks)

| File | Change |
|------|--------|
| `src/modules/court-block/court-block.router.ts` | Added owner-protected list/create/cancel endpoints. |
| `src/modules/court-block/services/court-block.service.ts` | Ownership checks, overlap enforcement, computed walk-in pricing. |
| `src/modules/court-block/repositories/court-block.repository.ts` | CRUD + range queries and active filtering. |
| `src/modules/court-block/factories/court-block.factory.ts` | Service wiring + dependencies. |
| `src/shared/infra/trpc/root.ts` | Registered `courtBlock` router. |

### Availability + Reservation Rules

| File | Change |
|------|--------|
| `src/modules/availability/services/availability.service.ts` | Ignore inactive blocks in availability computation. |
| `src/modules/reservation/services/reservation.service.ts` | Block range checks include active court blocks. |
| `src/shared/lib/toast-errors.ts` | Friendly error messages for court-block validation. |

### Owner UI

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Added maintenance + walk-in dialogs, block list, and quick walk-in action. |
| `src/components/form/types.ts` | Allowed `datetime-local` input type. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/context.md` | Logged new plan entry. |
| `agent-plans/user-stories/05-availability-management/05-00-overview.md` | Updated story index and superseded legacy slot stories. |
| `agent-plans/user-stories/05-availability-management/05-03-owner-blocks-time-range-maintenance.md` | Added maintenance block story. |
| `agent-plans/user-stories/05-availability-management/05-04-owner-creates-walk-in-booking-block.md` | Added walk-in block story. |
| `agent-plans/67-owner-court-blocks/*` | Added implementation plan and checklist. |

## Key Decisions

- Walk-in blocks use computed schedule pricing only (no manual override).
- Blocks cannot overlap active reservations or other active blocks.
- Blocks are soft-cancelled to preserve analytics history.
- Walk-in duration must be a multiple of 60 minutes (matches player booking).

## Next Steps

- [ ] Apply migration in production (if not already).
- [ ] Decide whether to add the gross revenue analytics endpoint (Phase 4).

## Commands to Continue

```bash
pnpm db:push
pnpm lint
TZ=UTC pnpm build
```
