# US-18-02: Admin Reviews Guest Removal Request Details

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **admin**, I want to **review guest-provided removal request details** so that **I can contact the requester and decide whether to remove the listing**.

---

## Acceptance Criteria

### Guest Metadata Visible

- Given a removal request was submitted by a guest
- When I open the claim review page
- Then I see the guest name and email
- And I see the removal reason

### Review Actions Remain The Same

- Given I am reviewing a guest removal request
- When I approve or reject the request
- Then the same approve/reject actions are available

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Guest metadata missing | Show placeholders and flag for follow-up |
| Request already reviewed | Review actions are disabled |

---

## References

- PRD: Admin reviews and processes removal requests
