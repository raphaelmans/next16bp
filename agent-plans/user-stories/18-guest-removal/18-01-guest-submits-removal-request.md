# US-18-01: Guest Submits Removal Request For Curated Place

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **guest visitor**, I want to **submit a removal request for a curated place listing** so that **the admin team can review and remove outdated or inappropriate listings**.

---

## Acceptance Criteria

### Removal CTA Visible To Guests

- Given I am not authenticated
- When I view a curated place page
- Then I see an option to request listing removal

### Removal Request Form

- Given I open the removal request form
- When I view the fields
- Then I see name, email, and reason inputs
- And the reason is required

### Submit Removal Request

- Given I completed the removal request form
- When I submit the form
- Then the removal request is created in pending status
- And the place claim status updates to removal requested

### Authenticated Users Remain Unblocked

- Given I am authenticated
- When I view the curated place page
- Then the guest removal request option is still available

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place is not curated | Do not show removal request UI |
| Place is already removal requested | Show status and disable form |
| Pending claim/removal already exists | Block submission and show status text |
| Network error on submit | Show error toast and keep dialog state |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Full name | text | Yes |
| Email | email | Yes |
| Reason | textarea | Yes |

---

## References

- PRD: Claimed place owners may request to remove their listing (extend to guest requests)
