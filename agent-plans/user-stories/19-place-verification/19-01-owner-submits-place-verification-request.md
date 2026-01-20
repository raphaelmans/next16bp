# US-19-01: Owner Submits Place Verification Request

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **submit a verification request for a place I own (with supporting documents)** so that **the platform can confirm I legitimately operate the venue before I can enable reservations**.

---

## Acceptance Criteria

### Verification CTA Is Owner-only

- Given I am not authenticated
- When I view an unverified place
- Then I do not see a "Request Verification" action

### Verification CTA Visible When Needed

- Given I am authenticated and I own the organization that owns the place
- And the place is not yet verified
- When I view the place in the owner dashboard
- Then I see a "Request Verification" action

### Verification Request Form Includes Documents

- Given I open the verification request form
- When I view the fields
- Then I see an optional notes input
- And I can attach one or more verification documents

### Submit Verification Request

- Given I completed the verification request form and attached documents
- When I submit
- Then a verification request is created in a pending status
- And the place shows a "Verification Pending" status
- And I cannot submit another pending verification request for the same place

### Owner Can Track Status

- Given I submitted a verification request
- When I view the place in the owner dashboard
- Then I see the current verification status (pending/approved/rejected)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place is already verified | "Request Verification" is hidden or disabled |
| Place already has a pending verification request | Show status and disable resubmission |
| Owner uploads unsupported file type | Upload is blocked with a clear validation message |
| Upload fails mid-way | Show error and allow retry without losing the rest of the form |
| Owner tries to verify a place they do not own | Submission is blocked |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Notes | textarea | No |
| Verification documents | file upload (multiple) | Yes |

---

## References

- PRD: Trust & safety requirement to prevent fake owner-created venues from becoming bookable
