# US-12-02: Player Booking Respects Court Policies

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want **booking behavior to follow the court’s configured policies** so that **I have a predictable and fair booking experience**.

---

## Acceptance Criteria

### Booking Flow Uses Court Policies

- Given I am booking a slot for a specific court
- When I attempt to reserve the slot
- Then the system enforces that court’s reservation policy (server-side)

### Owner Confirmation Toggle

- Given the court is configured to **not require owner confirmation**
- When I complete the required booking steps (e.g., mark payment complete)
- Then the reservation transitions to its final confirmed state without owner intervention

- Given the court **requires owner confirmation**
- When I complete the required booking steps
- Then the reservation becomes pending owner review and requires owner confirm/reject

### TTL Visibility

- Given the court has a payment hold window
- When I see a reservation requiring payment
- Then I can see the time remaining before expiration

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Court policies change mid-reservation | Existing reservations continue with the rules captured at creation (or clearly documented behavior) |
| Player tries to reserve an invalid/expired slot | Reservation is rejected with a clear error |

---

## References

- `agent-plans/user-stories/06-court-reservation/`
- `agent-plans/user-stories/07-owner-confirmation/`
- `docs/reservation-state-machine.md`
