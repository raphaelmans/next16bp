# US-17-03: Owner Submits Place Claim Request From Public Page

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **submit a claim request for a curated place** so that **I can take ownership and enable bookings through the platform**.

---

## Acceptance Criteria

### Claim CTA Is Authenticated-only

- Given I am not authenticated
- When I view a curated place page
- Then I do not see a claim request form

### Claim CTA Is Owner-only

- Given I am authenticated but have no organization
- When I view a curated place page
- Then I do not see a claim request form

### Claim Request Dialog

- Given I am authenticated and I own an organization
- When I click "Claim this place"
- Then I see a dialog with an organization selector and optional notes

### Submit Claim Request

- Given I opened the claim request dialog
- When I submit the claim request
- Then the claim request is created in pending status
- And the place is marked as claim pending

### Prevent Duplicate Pending Claims

- Given I already submitted a claim request for the place
- When I attempt to submit again
- Then I see an error and the request is not duplicated

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place is not curated | Do not show claim UI |
| Place is already claimed | Do not show claim UI |
| Place already has a pending claim | Disable claim UI and show status |
| Network error on submit | Show error toast and keep dialog state |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Organization | select | Yes |
| Notes | textarea | No |

---

## References

- PRD: Owners can claim curated listings
