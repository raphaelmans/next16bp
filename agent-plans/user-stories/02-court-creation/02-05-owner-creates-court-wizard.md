# US-02-05: Owner Creates Court via Setup Wizard

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **create a court using a guided setup wizard** so that **I can complete each required section step-by-step and avoid missing information**.

---

## Acceptance Criteria

### Wizard Entry Point

- Given I am an owner on `/owner/courts`
- When I click "Add New Court"
- Then I land on `/owner/courts/new` with a setup wizard
- And the active step is stored in the `step` query param via nuqs

### Step Navigation

- Given I am in the wizard
- When I click Next or Back
- Then the `step` query param updates
- And browser back/forward preserves the current step

### Required Fields Per Step

- Given I am on the Basic step
- When the court name is empty
- Then Next is disabled and inline validation appears
- Given I am on the Location step
- When address or city is missing
- Then Next is disabled and inline validation appears
- Given I am on the Payment step for a paid court
- When the default hourly rate is empty
- Then submission is disabled and an error is shown

### Review & Submit

- Given all steps are complete
- When I submit the final step
- Then the court is created with reservable settings
- And I am redirected to `/owner/courts/[id]/slots` with a success toast

### Cancel Flow

- Given I am in the wizard
- When I click Cancel
- Then I return to `/owner/courts` without creating a court

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Invalid or missing `step` param | Default to first step |
| Refresh mid-wizard | Stay on same step with data preserved |
| Navigate directly to later step | Show step but prevent submit until required fields complete |
| Network error on submit | Show error toast and keep data |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Name | text | Yes |
| Address | text | Yes |
| City | select | Yes |
| Latitude | number | No |
| Longitude | number | No |
| Amenities | multi-select | No |
| Default Hourly Rate | number | No (Yes if paid) |
| Currency | select | Yes |
| Payment Instructions | textarea | No |
| GCash Number | text | No |
| Bank Name | text | No |
| Bank Account Number | text | No |
| Bank Account Name | text | No |

---

## References

- PRD: Section 5 (Court setup)
- PRD: Section 9 (Availability management)
- Related: `agent-plans/user-stories/02-court-creation/02-02-owner-creates-court.md`
