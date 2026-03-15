# US-15-06: Owner Sees Payment Method Setup Reminders

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to be reminded to add payment methods when setting up my places or reviewing reservations so that I can receive payments on time.

---

## Acceptance Criteria

### New Place Flow Reminder

- Given the owner opens `owner/places/new`
- When the organization has zero payment methods
- Then show a reminder card above the place form
- And the card links to the payment methods section in owner settings
- And the reminder is hidden once at least one payment method exists

### Owner Reservations Reminder

- Given the owner opens `owner/reservations`
- When the organization has zero payment methods
- Then show an informational reminder card near the top of the page
- And the card links to the payment methods section in owner settings
- And the reminder is hidden once at least one payment method exists

---

## Edge Cases

| Scenario | Behavior |
| --- | --- |
| Organization data still loading | Hide the reminder until data is available |
| Owner has no organization | Do not show reminder |
| Payment methods request fails | Hide the reminder and allow the page to function |

---

## Form Fields (if applicable)

| Field | Type | Required |
| --- | --- | --- |
| N/A | - | - |

---

## References

- PRD: Section on owner onboarding and P2P payments
- Design System: `business-contexts/kudoscourts-design-system.md`
