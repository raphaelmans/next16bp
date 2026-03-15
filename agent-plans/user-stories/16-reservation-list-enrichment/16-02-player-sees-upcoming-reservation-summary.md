# US-16-02: Player sees upcoming reservation summary with real court data

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want the home dashboard to show upcoming reservations with real court and schedule details so that I can quickly confirm my next game.

---

## Acceptance Criteria

### Upcoming reservations summary shows real details

- Given the player has upcoming reservations
- When the home dashboard loads
- Then each item shows the court name, address, date/time, and status

### Empty state when no upcoming reservations

- Given the player has no upcoming reservations
- When the home dashboard loads
- Then the empty state messaging is shown

### Loading state remains visible while fetching

- Given the upcoming reservations query is loading
- When the home dashboard renders
- Then the loading skeleton is shown instead of placeholder data

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Reservation lacks an address | Display the court name without the address line |
| Reservation start time missing | Fall back to the reservation created time for display |

---

## References

- PRD: Reservation visibility for players
