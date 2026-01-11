# Reservation State Machine (TTL)

This documentation is split into multiple levels of detail so you can share the right depth with product, stakeholders, and engineering.

## Levels of detail
- Level 0 (one-minute summary): `docs/reservation-state-machine-level-0-summary.md`
- Level 1 (product narrative): `docs/reservation-state-machine-level-1-product.md`
- Level 2 (engineering states & diagrams): `docs/reservation-state-machine-level-2-engineering.md`
- Level 3 (automation & ops): `docs/reservation-state-machine-level-3-ops.md`

## What changed recently
- Reservation policies are now **court-specific** (TTL windows, owner confirmation, cancellation cutoff).
- Owner ops still surface **active reservations** (`AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`) via:
  - Slot list quick actions
  - Floating alerts panel
  - `/owner/reservations/active`
  - `/owner/reservations/[id]`
- Player cancellation is allowed across all non-terminal states (subject to cutoff).

## Source references
- `agent-contexts/00-06-feature-implementation-status.md`
- `agent-contexts/00-13-owner-reservation-ops.md`
