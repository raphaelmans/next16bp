# US-17-04: Admin Reviews and Approves Place Claim

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **admin**, I want to **review and approve place claim requests** so that **ownership transfers are legitimate and curated listings become bookable only after approval**.

---

## Acceptance Criteria

### Review Claim Request

- Given I am an authenticated admin
- When I view a pending claim request
- Then I can see the place, the organization requesting ownership, and the submitted notes

### Approve Claim Request

- Given a claim request is pending
- When I approve the claim request
- Then the place becomes reservable under the requesting organization
- And the place's courts are owned by the organization via the place ownership relationship

### Contact Info Preserved

- Given a curated place has contact details
- When the claim request is approved
- Then the contact details remain available (not deleted)

### Reject Claim Request

- Given a claim request is pending
- When I reject the claim request with a reason
- Then the request is marked rejected
- And the place remains unclaimed (or returns to the appropriate previous status)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Claim request already reviewed | Block re-approval/rejection |
| Place already claimed by another org | Block approval |
| Admin leaves review notes empty | Allow on approve; require on reject |

---

## References

- PRD: Admin-reviewed place claiming
