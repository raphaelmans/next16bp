## Why

Player booking is one of the highest-risk UX flows and currently has fragmented test coverage across booking entrypoints. We need systematic service and router tests to protect booking correctness, eligibility, availability, and pricing behavior.

## What Changes

- Add/expand TDD coverage for booking entrypoints in `ReservationService`:
  - `createReservationForCourt`
  - `createReservationForAnyCourt`
  - `createReservationGroup`
- Add/expand router-level coverage for `reservationRouter` booking and player actions:
  - create routes, mark payment paths, cancellation, payment info and detail retrieval
  - error mapping for bad request / forbidden / not found cases
- Add integration-with-mocks scenarios for booking constraints:
  - place verification and reservations enabled checks
  - slot conflicts and availability races
  - addon selection validity
  - incomplete profile rejection
  - pricing and currency consistency for grouped bookings

## Capabilities

### New Capabilities
- `player-court-booking-testing`: Defines required behavioral test coverage for player booking entrypoints, booking constraints, and router contract mapping.

### Modified Capabilities
- None.

## Impact

- Affected server modules:
  - `src/lib/modules/reservation/services/reservation.service.ts`
  - `src/lib/modules/reservation/reservation.router.ts`
- Affected tests (new/expanded):
  - `src/__tests__/modules/reservation/reservation.service.test.ts`
  - `src/__tests__/lib/modules/reservation/services/reservation.service.test.ts`
  - `src/__tests__/lib/modules/reservation/reservation.router.test.ts`
- No API or database schema changes.
