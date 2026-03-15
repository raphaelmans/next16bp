
**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **admin**, I want to **transfer a place to a selected organization** so that **ownership can be assigned immediately during onboarding calls or in-person verification**.

---

## Acceptance Criteria

### View Ownership Context

- Given I am an authenticated admin
- When I open a place in the admin courts view
- Then I can see the current organization (if any), place type, and claim status

### Transfer to Organization

- Given a place is curated or reservable
- When I select a target organization and confirm transfer
- Then the place is assigned to that organization
- And the place claim status becomes `CLAIMED`
- And the place becomes `RESERVABLE`

### Preserve Court Inventory and Reservations

- Given a place has existing courts and reservations
- When I transfer ownership
- Then all courts remain associated with the place
- And existing reservations remain unchanged

### Auto-Verify and Enable Reservations

- Given the admin chooses auto-verify
- When the transfer is confirmed
- Then the place is marked VERIFIED
- And reservations are enabled immediately

### Share Owner Link

- Given the transfer succeeds
- When I click "Copy owner link"
- Then I can share a login link that opens the owner portal for the place

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No organization selected | Disable transfer action and prompt selection |
| Organization already owns place | Block transfer and show warning |
| Target organization missing | Show error and keep ownership unchanged |
| Transfer fails mid-request | No ownership changes are persisted |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Organization | select | Yes |
| Auto-verify & enable | checkbox | Yes |

---

## References

- PRD: Section 4.3 (Admin needs)
- PRD: Section 6 (Place claiming flow)
