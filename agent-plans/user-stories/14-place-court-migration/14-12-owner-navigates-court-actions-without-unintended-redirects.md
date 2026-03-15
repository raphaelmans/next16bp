# US-14-12: Owner Navigates Court Actions Without Unintended Redirects

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **open the court actions menu and navigate to Hours / Pricing Rules / Slots pages reliably** so that **I can configure a court without accidental redirects or broken links**.

---

## Acceptance Criteria

### Actions Menu Does Not Trigger Row Redirect

- Given I am viewing the courts list for a place
- When I click the court actions ("...") button
- Then the actions dropdown opens
- And I am not redirected to another page

### Actions Menu Routes To The Correct Pages

- Given I have opened the court actions dropdown
- When I click "Edit Hours"
- Then I am routed to the court hours configuration page for that court

- Given I have opened the court actions dropdown
- When I click "Pricing Rules"
- Then I am routed to the court pricing configuration page for that court

- Given I have opened the court actions dropdown
- When I click "Manage Slots"
- Then I am routed to the slot management page for that court

### Row Navigation Still Works Outside Menu

- Given I am viewing the courts list for a place
- When I click the row (not the actions menu)
- Then I am routed to the intended default court management page

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Court actions menu is clicked repeatedly | Dropdown remains stable and does not navigate unexpectedly |
| Court is inactive | Actions still navigate to configuration pages (if allowed) or show clear disabled states |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Owner court management)
- Domain Stories: `agent-plans/user-stories/14-place-court-migration/`
