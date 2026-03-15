# US-14-14: Owner Uses Court Setup Wizard

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **configure court details, hours, pricing rules, and slot publishing from a single setup wizard** so that **I can complete court setup quickly without jumping between multiple pages**.

---

## Acceptance Criteria

### Wizard Provides Step-by-Step Flow

- Given I open a court setup wizard
- When I move through the steps
- Then I see clear progress (Step 1 of 4)
- And each step corresponds to Details, Hours, Pricing, and Publish

### Details Step Requires Save Before Continuing

- Given I am on the Details step
- When I click "Save & Continue"
- Then my changes are saved
- And I can proceed to Hours
- And if no changes were made, I can still proceed without errors

### Hours And Pricing Steps Are Fully Editable

- Given I am on the Hours step
- When I edit windows and save
- Then the changes persist
- And I can proceed to Pricing

- Given I am on the Pricing step
- When I edit pricing rules and save
- Then the changes persist
- And I can proceed to Publish

### Publish Step Offers Immediate Publishing Or Slot Management

- Given I have configured hours and pricing rules
- When I reach the Publish step
- Then I can open slot publishing immediately
- And I can also navigate to the full slot management page

### Publishing Is Blocked When Prereqs Are Missing

- Given hours or pricing rules are missing
- When I reach the Publish step
- Then publishing is disabled
- And I see guidance to complete the missing steps

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User refreshes the page mid-wizard | The current step remains accessible and reflects saved data |
| Court is inactive | Wizard indicates status but still allows configuration (if permitted) |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Owner court setup UX)
- Domain Stories: `agent-plans/user-stories/14-place-court-migration/`
