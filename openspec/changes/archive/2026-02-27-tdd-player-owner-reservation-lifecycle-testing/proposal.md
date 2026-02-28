## Why

The reservation lifecycle between player and owner (created, awaiting payment, payment marked, confirmed/rejected/cancelled) is central to the product and highly stateful. We need end-to-end behavioral coverage at service and router boundaries to protect lifecycle transitions and side effects.

## What Changes

- Expand lifecycle-focused tests for `ReservationService` and `ReservationOwnerService`:
  - valid and invalid status transitions
  - single and group transition parity
  - ownership/permission enforcement
  - cancellation and expiry handling
- Expand router-level tests for reservation owner actions:
  - accept/confirm/reject (single + group)
  - guest booking and walk-in conversion paths
  - payment confirmation variants
  - error mapping for conflict/forbidden/not-found cases
- Add integration-with-mocks checks for lifecycle side effects:
  - notification enqueue behavior
  - reservation chat operation hooks where lifecycle-dependent

## Capabilities

### New Capabilities
- `player-owner-reservation-lifecycle-testing`: Defines required coverage for reservation lifecycle transitions, owner action contracts, and cross-module lifecycle side effects.

### Modified Capabilities
- None.

## Impact

- Affected server modules:
  - `src/lib/modules/reservation/services/reservation.service.ts`
  - `src/lib/modules/reservation/services/reservation-owner.service.ts`
  - `src/lib/modules/reservation/reservation-owner.router.ts`
- Affected tests (new/expanded):
  - `src/__tests__/modules/reservation/reservation.service.test.ts`
  - `src/__tests__/modules/reservation/reservation-owner.service.test.ts`
  - `src/__tests__/lib/modules/reservation/reservation-owner.router.test.ts`
- No API or database schema changes.
