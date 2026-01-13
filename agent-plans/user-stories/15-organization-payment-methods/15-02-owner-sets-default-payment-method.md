# US-15-02: Owner Sets Default Payment Method

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **set a default payment method** so that **players see the recommended option first**.

---

## Acceptance Criteria

### Set Default

- Given I am the owner of an organization
- When I mark a payment method as default
- Then that method becomes the organization’s default
- And there is at most **one** default method at a time

### Default Visibility

- Given my organization has a default payment method
- When a player views payment methods on the payment page
- Then the default method is displayed first and/or visually marked as “Recommended”

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Owner sets default on an inactive method | System prevents it or activates the method first |
| Owner has only one method | That method can be set as default |
| Owner removes default method | System requires another default or falls back to first active |

---

## References

- `agent-plans/user-stories/15-organization-payment-methods/15-01-owner-manages-organization-payment-methods.md`
