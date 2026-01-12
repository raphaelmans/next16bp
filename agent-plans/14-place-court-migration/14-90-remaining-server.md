# Remaining Work Checklist — Server/DB

**Owner:** Server/DB Dev  
**Scope:** Bring backend + schema behavior to feature-complete v1.2

**Status:** Completed (verified 2026-01-12)

## References

- Plan overview: `agent-plans/14-place-court-migration/14-00-overview.md`
- Server plan: `agent-plans/14-place-court-migration/14-02-server-api.md`
- DB plan: `agent-plans/14-place-court-migration/14-01-db-schema.md`
- Reservation contract: `docs/reservation-state-machine-level-2-engineering.md`

---

## A) Reservation Contract Alignment (Mutual Confirmation)

- [x] Booking request creates reservation in `CREATED` (awaiting owner acceptance)
- [x] Booking request holds all selected slots immediately: `AVAILABLE` → `HELD`
- [x] `CREATED.expiresAt = now + 15 minutes` (owner acceptance window)
- [x] Owner accept endpoint exists and implements paid/free branching (`reservationOwner.accept`)
  - [x] Free booking: `CREATED` → `CONFIRMED` and slots `HELD` → `BOOKED`
  - [x] Paid booking: `CREATED` → `AWAITING_PAYMENT` and reset TTL to `now + 15 minutes`
- [x] Cancel/reject paths support `CREATED` (player cancel, owner reject, cron expiry)

> Completed: reservation creation now starts in `CREATED` and holds slots.

---

## B) Multi-Slot Reservation Integrity (Strategy A)

- [x] Confirm all multi-slot actions operate on the full set of linked slots
  - [x] Creation writes `reservation_time_slot` rows for every slot
  - [x] Status transitions update **all** linked slots
- [x] Cron expiration releases **all** linked slots
  - [x] Update `/api/cron/expire-reservations` to release all slots via `reservation_time_slot`
- [x] Cancellation releases **all** linked slots
- [x] Owner rejection/cancellation releases **all** linked slots

---

## C) Duration & Slot Granularity Enforcement

- [x] Enforce `durationMinutes` is multiple of 60 for reservation + availability endpoints
- [x] Enforce slot duration is multiple of 60 for owner slot creation and bulk creation

---

## D) Pricing Rule → Slot Price Materialization

- [x] Define and implement the contract for slot pricing:
  - [x] Slot `priceCents/currency` is computed from `court_rate_rule` when slots are created
  - [x] Slot-level overrides remain supported
- [x] Validate pricing coverage:
  - [x] If a court is open but has no pricing rule coverage, define behavior (reject publishing paid slots vs treat as free)

---

## E) APIs for Client Wiring

- [x] `place.list` returns: place summary + sport badges + courtCount + lowestPrice
- [x] `place.getById` returns: place detail + courts + sports + photos
- [x] `availability.getForCourt` returns stable `AvailabilityOption[]` for duration
- [x] `availability.getForPlaceSport` returns stable `AvailabilityOption[]` for duration

---

## F) Reservation Creation Endpoints

- [x] Ensure the new endpoints are the preferred path for v1.2 booking:
  - [x] `reservation.createForCourt({ courtId, startTime, durationMinutes })`
  - [x] `reservation.createForAnyCourt({ placeId, sportId, startTime, durationMinutes })`
- [x] Endpoint responses contain enough UI context:
  - [x] assigned `courtId`, `courtLabel`
  - [x] total price + currency
  - [x] reservation id + status

---

## G) Validation

- [x] `pnpm lint`
- [x] `pnpm build`

---

## Completion Notes

- Reservation creation starts in `CREATED` and holds slots in `HELD`: `src/modules/reservation/use-cases/create-free-reservation.use-case.ts`, `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts`.
- Owner acceptance transitions paid/free: `src/modules/reservation/services/reservation-owner.service.ts`.
- Slot pricing is materialized from `court_rate_rule` on slot creation: `src/modules/time-slot/services/time-slot.service.ts` (`resolveSlotPricing`).
