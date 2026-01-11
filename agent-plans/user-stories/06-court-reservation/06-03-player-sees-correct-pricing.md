# US-06-03: Player Sees Correct Pricing During Booking

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **see accurate pricing for paid courts during discovery and booking** so that **I understand the correct amount due before confirming a reservation**.

---

## Acceptance Criteria

### Court Detail Price Display

- Given I am on a reservable court detail page
- When the court has a default hourly rate
- Then the booking sidebar shows the correct price per hour

### Slot Pricing Fallback

- Given a time slot has no custom price
- When I view available slots
- Then the slot price uses the court’s default hourly rate

### Custom Price Override

- Given a time slot has its own custom price
- When I view available slots
- Then the slot price shows the custom price instead of the default

### Booking Summary Amount

- Given I select a time slot
- When I view the booking summary
- Then the total amount uses the slot’s custom price or the court default

### Payment Page Amount

- Given I complete a paid reservation
- When I reach the payment page
- Then the amount due reflects the slot’s custom price or the court default

### Free Court Display

- Given the court is marked free
- When I view the booking sidebar or slots
- Then pricing displays as "Free" with no currency amount

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Default rate updated after slots exist | Slots without custom price reflect the new rate |
| Slot missing currency | Use court default currency |
| Default rate missing and slot price missing | Treat as Free |
| Mixed custom and default prices | Each slot displays its effective price |

---

## References

- PRD: Section 7 (Court discovery + booking)
- PRD: Section 8.3 (Paid court lifecycle)
- Related: `agent-plans/user-stories/06-court-reservation/06-02-player-books-paid-court.md`
- Related: `agent-plans/user-stories/02-court-creation/02-02-owner-creates-court.md`
- Related: `agent-plans/user-stories/05-availability-management/05-01-owner-creates-time-slots.md`
