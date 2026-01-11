# US-12-03: Player Cancels Reservation (All States)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **cancel my reservation in any state** so that **I can correct mistakes or free the slot if I can no longer attend**.

---

## Acceptance Criteria

### Cancellation Allowed Across States

- Given I have a reservation
- When I choose to cancel it
- Then cancellation is allowed regardless of its current state

### Cutoff Enforcement

- Given a court has a cancellation cutoff policy
- When the reservation is too close to the slot start time
- Then cancellation is blocked with a clear reason

### Slot Release

- Given I successfully cancel a reservation
- When cancellation completes
- Then the underlying time slot becomes available again

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Reservation is already expired or cancelled | Cancellation is idempotent or shows a clear “already ended” state |
| Slot has started or ended | Cancellation is blocked (cutoff effectively reached) |

---

## References

- `agent-plans/user-stories/06-court-reservation/`
- `docs/reservation-state-machine.md`
