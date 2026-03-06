# Reservation-First Unification

Last updated: 2026-03-06

## Goal
Treat every booking flow as `reservation`-first.

- Canonical identifier: `reservationId`
- Linked/grouped reservations are an internal implementation detail
- Legacy group URLs and contracts are supported only as compatibility shims

## Implemented Contract Changes

### Owner tRPC
- Removed group action procedures:
  - `acceptGroup`
  - `confirmPaymentGroup`
  - `rejectGroup`
  - `cancelGroup`
  - `getGroupDetail`
- Added reservation-first procedures:
  - `getLinkedDetail({ reservationId })`
  - `resolveLegacyGroup({ reservationGroupId })`

### Player tRPC
- Removed group procedures:
  - `markPaymentGroup`
  - `getGroupDetail`
- Added reservation-first procedures:
  - `markPaymentLinked({ reservationId, termsAccepted: true })`
  - `getLinkedDetail({ reservationId })`

### Service Behavior
- Single-reservation owner/player actions now fan out to linked reservations when the source reservation has a `groupId`.
- Linked-detail reads return a single normalized shape for both single and linked reservations.

### Legacy Route Compatibility
- `/organization/reservations/group/[groupId]` now resolves to a representative reservation and redirects to:
  - `/organization/reservations/[reservationId]`

## Frontend Changes

- Owner and player API adapters now call linked/single reservation endpoints.
- Reservation detail/payment pages now fetch linked details using `reservationId`.
- Booking Studio cancel dialog now has one owner action (`Cancel Reservation`) instead of separate single/group cancel buttons.

## Migration Rule for New Work

- Never create new feature contracts that require `reservationGroupId` as primary input.
- If legacy integration still emits `reservationGroupId`, resolve it to `reservationId` at the boundary.

## Notes

- `reservation_group` tables/columns still exist in storage for internal linking and backward compatibility.
- This document is the canonical reference for reservation/group API naming going forward.
