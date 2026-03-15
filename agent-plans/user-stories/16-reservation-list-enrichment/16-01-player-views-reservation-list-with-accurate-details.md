# US-16-01: Player views reservation list with accurate details

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want my reservation list to show accurate court, time, and pricing details so that I can confirm my bookings at a glance.

---

## Acceptance Criteria

### Reservation list shows complete booking details

- Given the player has reservations
- When the player opens My Reservations
- Then each reservation card shows the court name (place + court label), address, date, time range, price, and status
- And the card displays a cover image when the place has photos

### Multi-slot reservations aggregate correctly

- Given a reservation spans multiple time slots
- When the list renders
- Then the start time reflects the earliest slot
- And the end time reflects the latest slot
- And the price reflects the total across all slots

### Missing imagery uses a placeholder

- Given a reservation’s place has no photos
- When the list renders
- Then the UI shows the "No image" placeholder

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Reservation has null pricing | Display the price as ₱0.00 with a default currency fallback |
| Reservation is cancelled or expired | Still show full court and slot details with status visible |

---

## References

- PRD: Reservation management and player booking flows
