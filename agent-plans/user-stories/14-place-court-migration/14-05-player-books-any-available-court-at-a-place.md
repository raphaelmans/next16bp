# US-14-05: Player Books “Any Available Court” At A Place

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **book “any available court” at a place for a given sport** so that **I can reserve time even if I don’t care which exact court I get**.

---

## Acceptance Criteria

### Any-Available Mode Is Offered

- Given a place has multiple courts for a sport
- When I begin booking
- Then I can choose “Any available court” instead of picking a specific court

### System Assigns A Specific Court For The Booking

- Given I chose “Any available court”
- When I request a booking for a start time and duration
- Then the system assigns a specific court that can satisfy the request
- And the reservation details show the assigned court label

### Assignment Uses A Documented Rule

- Given multiple courts could satisfy the request
- When the system chooses one
- Then the selection follows a documented rule (deterministic and fair)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No courts can satisfy the request | Booking request fails with a clear “no availability” message |
| Two players attempt the same slot simultaneously | Only one booking request succeeds; the other receives a conflict/not-available error |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Any Available Court)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (selection across courts)
