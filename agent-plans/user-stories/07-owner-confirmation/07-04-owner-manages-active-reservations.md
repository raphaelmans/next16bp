# US-07-04: Owner Manages Active Reservations with TTL

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want a **dedicated page for active reservations with TTL** so that **I can track pending payments, confirm marked payments, and respond before reservations expire**.

---

## Acceptance Criteria

### Active Reservations Page

- Given I am an owner
- When I navigate to `/owner/reservations/active`
- Then I see a list of active reservations grouped by status
- And each reservation links to `/owner/reservations/[id]`

### Status Visibility

- Given a reservation is `AWAITING_PAYMENT`
- When I view the active list
- Then it is labeled "Awaiting payment" with a visible TTL countdown
- Given a reservation is `PAYMENT_MARKED_BY_USER`
- When I view the active list
- Then it is labeled "Payment marked" with the player details

### Quick Actions

- Given a reservation is `AWAITING_PAYMENT`
- When I view the active list
- Then I can **View Reservation** or **Cancel/Expire**
- Given a reservation is `PAYMENT_MARKED_BY_USER`
- When I view the active list
- Then I can **Confirm** or **Reject** with a required reason

### TTL Handling

- Given the TTL expires
- When the list refreshes or polls
- Then the reservation is marked `EXPIRED` and removed from the active list
- And the slot becomes available again

### Filters

- Given I am on the active reservations page
- When I use the status filter
- Then I can filter by `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, or `ALL`

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No active reservations | Show empty state message |
| Reservation updated by another owner | List reflects latest status on refresh |
| TTL missing | Hide countdown and show "No TTL" badge |
| Network error | Show retry action |

---

## References

- PRD: Section 7 Journey 4 (Owner confirmation)
- PRD: Section 8.3 (Paid court lifecycle)
- Related: `agent-plans/user-stories/06-court-reservation/06-02-player-books-paid-court.md`
- Related: `agent-plans/user-stories/07-owner-confirmation/07-02-owner-confirms-rejects-reservation.md`
