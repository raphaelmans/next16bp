# Reservation State Machine (TTL)

This documentation is split into multiple levels of detail so you can share the right depth with product, stakeholders, and engineering.

## Levels of detail
- Level 0 (one-minute summary): `docs/reservation-state-machine-level-0-summary.md`
- Level 1 (product narrative): `docs/reservation-state-machine-level-1-product.md`
- Level 2 (engineering states & diagrams): `docs/reservation-state-machine-level-2-engineering.md`
- Level 3 (automation & ops): `docs/reservation-state-machine-level-3-ops.md`

## Changelog
- `docs/reservation-state-machine-changelog.md`

## Current contract (mutual confirmation)
- Player creates a booking request (`CREATED`) and the slot is held immediately.
- Owner must accept within 15 minutes.
- Paid bookings start a fresh 15-minute payment window on owner acceptance.
- `PAYMENT_MARKED_BY_USER` can still expire if the TTL passes.
