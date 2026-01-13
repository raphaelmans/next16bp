# US-15-04: Payment Methods Are Visible Only To Authorized Players

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want **payment method details to be visible only when I’m allowed to pay** so that **sensitive account details aren’t exposed publicly**.

---

## Acceptance Criteria

### Reservation Ownership Gate

- Given I am authenticated
- When I request payment method details for a reservation
- Then I only receive payment method details if I am the owner of that reservation

### Reservation Status Gate

- Given I am the reservation owner
- When the reservation is not in a payment-related status
- Then payment method details are hidden or not returned

### No Public Exposure

- Given I am not authenticated or I do not own the reservation
- When I browse public court or time slot endpoints
- Then I do not see any payment method account numbers

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Reservation was cancelled/expired | Payment methods are not returned |
| Reservation is already confirmed | Payment methods are not returned |
| Player has multiple reservations | Authorization checks are scoped per reservation |

---

## References

- Related: `agent-plans/user-stories/08-p2p-reservation-confirmation/`
