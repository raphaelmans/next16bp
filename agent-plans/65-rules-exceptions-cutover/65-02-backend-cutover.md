# Phase 2: Backend Cutover

**Dependencies:** Phase 1 complete

---

## Objective

Replace time-slot-based availability and reservation flows with schedule-driven availability + range-based reservations.

---

## Module 2A: Availability from schedule + reservations

**Files:**

- `src/modules/availability/services/availability.service.ts`
- `src/modules/availability/factories/availability.factory.ts`

Implementation:

1. Prefetch schedule rules:
   - court hours windows by courtIds
   - court rate rules by courtIds
2. Prefetch conflicts:
   - active reservations overlapping the requested window
   - blocks overlapping the requested window (if implemented)
3. Generate candidate start times per court/day using hours windows.
4. For each candidate, compute total price for `durationMinutes` using rate rules (and overrides if implemented).
5. Filter out candidates overlapping reservations/blocks.

---

## Module 2B: Reservation creation/owner ops without slots

**Files:**

- `src/modules/reservation/services/reservation.service.ts`
- `src/modules/reservation/use-cases/create-free-reservation.use-case.ts`
- `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts`
- `src/modules/reservation/services/reservation-owner.service.ts`
- `src/modules/reservation/repositories/reservation.repository.ts`

Implementation:

- Reservation creation:
  - validate place bookable
  - validate schedule open + pricing exists for each hour segment
  - insert reservation with `courtId/startTime/endTime/totalPriceCents/currency`
  - use `expiresAt` to represent the hold
- Owner acceptance:
  - move to `AWAITING_PAYMENT` if amount > 0 else `CONFIRMED`
  - no slot status updates

---

## Module 2C: Remove time-slot module

Remove:

- `src/modules/time-slot/*`
- router import from `src/shared/infra/trpc/root.ts`
- any client hooks relying on `trpc.timeSlot.*`

---

## Testing Checklist

- [ ] Public schedule pages load availability successfully.
- [ ] Booking creation works for court and any-court.
- [ ] Owner reservations inbox actions still work.
