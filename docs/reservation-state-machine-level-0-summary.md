# Reservation State Machine — Level 0 Summary

## One-minute summary
- Reservation policies are court-specific (payment window, owner confirmation, cancellation cutoff).
- Paid bookings hold slots for a court-defined window; they auto-confirm or wait for owner review based on policy.
- Player cancellation is allowed in all non-terminal states until the cutoff; expired/cancelled reservations release the slot.
