# Reservation State Machine — Level 0 Summary

## One-minute summary
- Free bookings confirm immediately; paid bookings hold slots for 15 minutes.
- If payment is not confirmed within the TTL, the reservation expires.
- Expired or cancelled reservations release the slot back to availability.
