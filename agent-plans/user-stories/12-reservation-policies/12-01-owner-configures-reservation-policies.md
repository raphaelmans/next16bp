# US-12-01: Owner Configures Reservation Policies Per Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **configure reservation policies for a specific court** so that **each court can have rules that match how it operates**.

---

## Acceptance Criteria

### Policy Configuration

- Given I am an owner of a reservable court
- When I open the court edit/settings page
- Then I can configure reservation policies specific to that court

### Required Policy Inputs (MVP)

- Given I am editing a court
- When I view reservation policy settings
- Then I can set:
  - Whether the court **requires owner confirmation** or not
  - The payment hold window in minutes (for paid reservations)
  - The cancellation cutoff in minutes (relative to slot start)

### Persistence

- Given I saved new policy settings
- When I revisit the court edit/settings page
- Then I see the saved values

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Court is not reservable | Policy settings are hidden or read-only |
| Invalid minutes value | Input is rejected with a clear error |
| Owner has multiple courts | Policies are saved per court without affecting others |

---

## References

- `agent-plans/user-stories/02-court-creation/`
- `agent-plans/user-stories/07-owner-confirmation/`
