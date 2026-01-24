# [01-05] Rules + Exceptions Cutover

> Date: 2026-01-24
> Previous: 01-04-booking-window-60-days.md

## Summary

Started a dev-only cutover away from `time_slot` materialization toward a schedule-driven availability model (rules + exceptions). Added new exception schemas/modules and began refactoring availability/reservations to work on explicit time ranges instead of slot IDs.

## Changes Made

### Planning

| File | Change |
|------|--------|
| `agent-plans/65-rules-exceptions-cutover/*` | Added plan for removing `time_slot` and owner slot UI; move to rules + exceptions. |
| `agent-plans/context.md` | Logged the new 65 plan in the changelog. |

### Database Schema

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/time-slot.ts` | Deleted slot materialization schema. |
| `src/shared/infra/db/schema/reservation-time-slot.ts` | Deleted reservation-to-slot join schema. |
| `src/shared/infra/db/schema/reservation.ts` | Began shifting reservations to explicit time ranges (no slot join). |
| `src/shared/infra/db/schema/court-block.ts` | Added court block exceptions table schema. |
| `src/shared/infra/db/schema/court-price-override.ts` | Added court price override exceptions table schema. |
| `src/shared/infra/db/schema/enums.ts` | Updated enums to remove slot-related enum usage. |
| `src/shared/infra/db/schema/index.ts` | Updated exports after schema changes. |

### Backend

| File | Change |
|------|--------|
| `src/shared/lib/schedule-availability.ts` | Added shared helpers for schedule-driven availability/pricing and overlap checks. |
| `src/modules/availability/services/availability.service.ts` | Refactored availability computation toward schedule + reservation overlap checks (slotless). |
| `src/modules/availability/factories/availability.factory.ts` | Updated availability wiring for the new approach. |
| `src/modules/court-hours/repositories/court-hours.repository.ts` | Added batched reads to support schedule-driven availability. |
| `src/modules/court-rate-rule/repositories/court-rate-rule.repository.ts` | Added batched reads to support schedule-driven availability. |
| `src/modules/reservation/repositories/reservation.repository.ts` | Began shifting reservation queries to be range-based (no slot join). |
| `src/modules/reservation/services/reservation.service.ts` | Began aligning reservation creation/guards with range-based logic (incomplete). |
| `src/modules/court-block/*` | Added initial module wiring for court blocks (exceptions). |
| `src/modules/court-price-override/*` | Added initial module wiring for price overrides (exceptions). |

### Frontend

| File | Change |
|------|--------|
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Adjusted schedule UI to work with the current availability API shape and booking window constraints. |
| `src/app/(public)/places/[placeId]/page.tsx` | Kept booking window guardrails aligned with schedule changes. |
| `src/features/discovery/components/booking-card.tsx` | Kept booking window guardrails aligned with schedule changes. |
| `src/features/owner/components/bulk-slot-modal.tsx` | Kept booking window guardrails (owner UI removal planned next). |

## Key Decisions

- This cutover is development-only; schema can be reset and old slot tables removed instead of writing data migrations.
- Availability should be derived from schedule (hours + rate rules) with exception overlays (blocks + price overrides) and reservation overlap checks.

## Next Steps

- [ ] Remove remaining `time_slot` module references (routers/services/cron/audit) and make `pnpm lint` + `TZ=UTC pnpm build` pass.
- [ ] Finish reservation creation/management as time-range based (no slot IDs; compute price from schedule rules).
- [ ] Remove owner slot management routes/pages/components and replace with schedule + exception management UX.
- [ ] Reset/apply DB schema (`pnpm db:push`) after slot tables are fully removed.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
pnpm db:push
```
