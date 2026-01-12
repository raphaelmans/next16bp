# Reservation State Machine — Level 0 Summary

## One-minute summary
- All bookings (free or paid) start as a **request** and require **owner acceptance**.
- When a player requests a booking, the slot is **held immediately** and the owner has **15 minutes** to accept.
- After owner acceptance:
  - Free bookings become **confirmed** immediately.
  - Paid bookings start a **fresh 15-minute payment window**.
- If the relevant timer expires at any point, the reservation **expires** and the slot returns to **available**.
