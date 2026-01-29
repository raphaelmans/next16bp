# Reservation State Machine — Level 0 Summary

## One-minute summary
- **Player bookings** (free or paid) start as a **request** (`CREATED`) and require **owner acceptance**.
- When a player requests a booking, the **time range is reserved immediately** and the owner has **45 minutes** to accept.
- After owner acceptance:
  - Free bookings become **confirmed** immediately.
  - Paid bookings start a **fresh 45-minute payment window**.
  - Owner may also confirm a paid booking directly (offline/handled payment), bypassing the payment flow: `CREATED → CONFIRMED`.
- **Guest bookings** are created by the owner on behalf of a walk-in or phone guest. They skip the entire request/payment flow and are **confirmed immediately**: `[*] → CONFIRMED`.
- If the relevant timer expires at any point, the reservation **expires** and the time range becomes **available again**.

## Identity invariant
Every reservation has **exactly one** of:
- `playerId` — the registered player who created or owns the booking, OR
- `guestProfileId` — an ad-hoc guest profile created by the owner.

These two fields are mutually exclusive and one must always be present.

## Availability model
- Availability is **computed on-the-fly** from schedule rules (`court_hours_window` + `court_rate_rule`) minus existing reservations and blocks.
- There are no stored "slot" rows — reservations directly store `courtId + startTime + endTime`.
