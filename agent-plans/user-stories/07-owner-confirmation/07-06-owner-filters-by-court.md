# US-07-06: Owner Filters Reservation Ops by Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **filter reservations by court across owner reservation ops** so that **I can focus on one court at a time when I manage multiple courts**.

---

## Acceptance Criteria

### Court Filter Availability

- Given I am an owner with multiple courts
- When I view owner reservation ops
- Then I can select **All Courts** or a **specific court**

### Reservations Page

- Given I am on `/owner/reservations`
- When I select a court in the court filter
- Then the reservations list is filtered to that court
- And the selection persists when I change tabs

### Active Reservations Page

- Given I am on `/owner/reservations/active`
- When I select a court in the court filter
- Then the active queue is filtered to that court

### Alerts Panel

- Given the floating alerts panel is open
- When I select a court in the panel filter
- Then only reservations for that court appear
- And the "View all" link routes to `/owner/reservations/active` with the same court filter

### Persistence

- Given I selected a specific court
- When I navigate between owner pages
- Then the selection persists for the session

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Owner has 0 courts | Court filter shows only "All Courts" and lists are empty |
| Invalid `courtId` value | Falls back to "All Courts" |
| Owner switches organizations | Court filter reflects the current org courts |

---

## References

- Related: `agent-plans/user-stories/07-owner-confirmation/07-04-owner-manages-active-reservations.md`
- Related: `agent-plans/user-stories/04-owner-dashboard/04-00-overview.md`
