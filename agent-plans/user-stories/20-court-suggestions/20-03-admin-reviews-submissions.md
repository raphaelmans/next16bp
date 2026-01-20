# US-20-03: Admin Reviews Suggested Court Submissions

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **admin**, I want to **review suggested curated courts and approve/reject them** so that **public discovery remains curated and high quality**.

---

## Acceptance Criteria

### Admin Sees Pending Queue

- Given one or more user submissions exist
- When I open the admin courts list
- Then I can filter to see pending approval submissions

### Admin Sees Submitter Attribution

- Given I am viewing a pending submission
- When I view it in list or detail
- Then I see the submitter email

### Approve

- Given a submission is pending
- When I approve it
- Then it becomes publicly discoverable

### Reject

- Given a submission is pending
- When I reject it
- Then it becomes inactive and remains not approved
- And it is not publicly visible

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Admin approves already-approved | No-op or safe error |
| Admin rejects already-rejected | No-op or safe error |
