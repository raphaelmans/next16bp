# US-07-05: Owner Reservation Alerts Panel

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want a **floating reservation alerts panel** so that **I can see active and newly created reservations, respond quickly, and jump to details when needed**.

---

## Acceptance Criteria

### Floating Panel Behavior

- Given I am on any owner screen
- When I open the alerts panel
- Then a draggable floating card appears with active reservations
- And the panel can be collapsed or dismissed

### Polling & New Reservation Highlighting

- Given the panel is open
- When 15 seconds pass
- Then the list refreshes automatically
- And reservations created since the last poll are highlighted as "New"

### Reservation Rows

- Given the panel lists reservations
- Then each row shows: player name, court name, slot time, status badge, TTL countdown (if applicable)
- And each row links to `/owner/reservations/[id]`

### Quick Actions

- Given a reservation is `AWAITING_PAYMENT`
- Then quick actions show **View** and **Cancel/Expire**
- Given a reservation is `PAYMENT_MARKED_BY_USER`
- Then quick actions show **Confirm** and **Reject** (requires reason)

### Empty State

- Given there are no active reservations
- Then the panel shows a friendly empty state with a link to `/owner/reservations/active`

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Polling error | Show inline retry with last updated time |
| Drag off-screen | Panel snaps back within viewport |
| Multiple new reservations | Badge shows count of new items |

---

## References

- PRD: Section 7 Journey 4 (Owner confirmation)
- Related: `agent-plans/user-stories/07-owner-confirmation/07-01-owner-views-pending-reservations.md`
- Related: `agent-plans/user-stories/07-owner-confirmation/07-02-owner-confirms-rejects-reservation.md`
