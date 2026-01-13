# US-15-05: Platform Applies Organization Reservation Policy Defaults

**Status:** Active  
**Supersedes:** US-12-01  
**Superseded By:** -

---

## Story

As the **platform**, I want to **apply reservation policy defaults at the organization level** so that **reservation timing rules are consistent across all places/courts in the same organization**.

---

## Acceptance Criteria

### Default Policy Exists For Organization

- Given an organization exists
- When the platform needs to evaluate reservation timing rules
- Then the organization has a reservation policy record
- And default values are applied if the owner has not configured anything

### Owner Review Window

- Given a player requests a reservation that requires owner acceptance
- When the reservation is created
- Then the owner review TTL is calculated using the organization policy’s owner review minutes

### Payment Hold Window

- Given an owner accepts a paid reservation
- When the reservation transitions to “Awaiting Payment”
- Then the payment window TTL is calculated using the organization policy’s payment hold minutes

### Cancellation Cutoff

- Given a player attempts to cancel a reservation
- When the system checks eligibility
- Then cancellation eligibility uses the organization policy’s cancellation cutoff minutes

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Organization policy record missing | System uses sane defaults and creates/repairs the missing record |
| Organization owns multiple places | Policy applies consistently across all places |

---

## References

- Supersedes: `agent-plans/user-stories/12-reservation-policies/12-01-owner-configures-reservation-policies.md`
