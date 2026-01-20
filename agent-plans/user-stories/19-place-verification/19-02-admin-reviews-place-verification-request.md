# US-19-02: Admin Reviews Place Verification Request

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **admin**, I want to **review place verification requests (including supporting documents) and approve or reject them** so that **only legitimate venue owners can enable reservation support**.

---

## Acceptance Criteria

### Admin Sees Pending Verification Requests

- Given I am an admin
- When I open the admin dashboard
- Then I can see pending place verification requests

### Admin Can View Request Details

- Given I open a verification request
- When I view the details
- Then I see the place details (name + location)
- And I see the organization requesting verification
- And I can view the uploaded verification documents

### Admin Approves Request

- Given a verification request is pending
- When I approve the request
- Then the request status becomes approved
- And the place status becomes verified

### Admin Rejects Request

- Given a verification request is pending
- When I reject the request with a reason
- Then the request status becomes rejected
- And the place status becomes rejected
- And the rejection reason is visible to the owner

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Request has no documents | Admin cannot approve and sees a warning |
| Request already reviewed | Approve/reject actions are disabled |
| Admin opens a deleted place | Show not-found and remove from pending list |

---

## References

- Related: `agent-plans/user-stories/17-place-claiming/` (admin-reviewed ownership workflow)
