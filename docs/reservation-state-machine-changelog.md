# Reservation State Machine — Changelog

This changelog tracks product/engineering contract changes to the reservation state machine documentation.

## 2026-01-12 — Add mutual confirmation before payment

### Why
- Owners could miss new booking intent until the player already paid/marked payment.
- The new flow ensures owners acknowledge/accept the booking before the player proceeds to payment.

### Changes
- Added explicit **request/acceptance** stage:
  - New meaning for `CREATED`: "Awaiting owner acceptance".
- All bookings (free + paid) now require **owner acceptance**.
- Slot hold behavior:
  - Slot is held immediately when the player requests (`AVAILABLE` → `HELD`).
- TTL behavior:
  - `CREATED` has a 15-minute owner acceptance window.
  - If owner accepts a paid request, `expiresAt` resets to a fresh 15-minute payment window.
  - `PAYMENT_MARKED_BY_USER` still expires when the same `expiresAt` passes.
- Owner ops behavior:
  - In `CREATED`: accept / cancel(reject) / view.
  - In `AWAITING_PAYMENT`: cancel / view.
  - In `PAYMENT_MARKED_BY_USER`: confirm / reject / view.

### Docs updated
- `docs/reservation-state-machine-level-0-summary.md`
- `docs/reservation-state-machine-level-1-product.md`
- `docs/reservation-state-machine-level-2-engineering.md`
- `docs/reservation-state-machine-level-3-ops.md`
- `docs/reservation-state-machine.md`
