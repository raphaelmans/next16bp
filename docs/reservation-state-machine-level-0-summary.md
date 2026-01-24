# Reservation State Machine — Level 0 Summary

## One-minute summary
- All bookings (free or paid) start as a **request** and require **owner acceptance**.
- When a player requests a booking, the **time range is reserved immediately** and the owner has **15 minutes** to accept.
- After owner acceptance:
  - Free bookings become **confirmed** immediately.
  - Paid bookings start a **fresh 15-minute payment window**.
- If the relevant timer expires at any point, the reservation **expires** and the time range becomes **available again**.

## Availability model
- Availability is **computed on-the-fly** from schedule rules (`court_hours_window` + `court_rate_rule`) minus existing reservations and blocks.
- There are no stored "slot" rows — reservations directly store `courtId + startTime + endTime`.
