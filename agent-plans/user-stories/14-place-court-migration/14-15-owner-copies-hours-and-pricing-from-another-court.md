# US-14-15: Owner Copies Hours And Pricing From Another Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **copy court hours or pricing rules from another court in my organization** so that **I can quickly configure multiple courts with the same schedule and rates**.

---

## Acceptance Criteria

### Copy Hours From Another Court

- Given I am configuring court hours
- When I choose a source court in my organization
- And I confirm copy
- Then the target court hours are replaced with the source court hours

### Copy Pricing From Another Court

- Given I am configuring pricing rules
- When I choose a source court in my organization
- And I confirm copy
- Then the target court pricing rules are replaced with the source court rules
- And currency values are copied exactly as configured

### Copy Scope Is Limited To The Organization

- Given I attempt to copy from a court outside my organization
- When I confirm
- Then the system rejects the action with a clear error

### Copy Does Not Affect Published Slots

- Given the target court already has published slots
- When I copy hours or pricing
- Then the existing slot records remain unchanged
- And the new configuration only affects future publishing

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Source court has no hours/pricing rules | Target becomes empty and reflects no configuration |
| Target has existing configuration | It is replaced after confirmation |
| No other courts exist in org | UI explains no available source courts |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Owner operational efficiency)
- Domain Stories: `agent-plans/user-stories/14-place-court-migration/`
