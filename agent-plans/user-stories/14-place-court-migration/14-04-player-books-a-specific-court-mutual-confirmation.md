# US-14-04: Player Books A Specific Court (Mutual Confirmation)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **book a specific court at a place** so that **my reservation is tied to a known physical court and follows the platform’s mutual-confirmation rules**.

---

## Acceptance Criteria

### Booking Creates A Request And Holds The Slot

- Given I select a specific court and an available slot
- When I request the booking
- Then a reservation is created in `CREATED` (awaiting owner acceptance)
- And the slot transitions to `HELD` immediately

### Owner Acceptance Is Required (Free And Paid)

- Given I requested a booking
- When the owner accepts within the acceptance window
- Then:
  - For free bookings: the reservation becomes `CONFIRMED` and the slot becomes `BOOKED`
  - For paid bookings: the reservation becomes `AWAITING_PAYMENT` and a payment window starts

### Player Can See Assigned Court In Reservation Details

- Given a reservation exists
- When I view reservation details
- Then I can see the place name and the court label (e.g., Court 7)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Owner does not accept in time | Reservation becomes `EXPIRED` and slot returns to `AVAILABLE` |
| Slot becomes unavailable before request completes | Booking request fails with a clear error |

---

## References

- Reservation contract: `docs/reservation-state-machine.md`
- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Journeys, Reservation System)
