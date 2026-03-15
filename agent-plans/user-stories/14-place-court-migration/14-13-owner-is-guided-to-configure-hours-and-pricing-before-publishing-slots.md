# US-14-13: Owner Is Guided To Configure Hours And Pricing Before Publishing Slots

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **see clear guidance and navigation links when court hours or pricing rules are missing** so that **I can complete configuration before publishing slots and avoid pricing/availability errors**.

---

## Acceptance Criteria

### Missing Hours Shows A Clear Alert

- Given I am trying to publish slots for a specific court
- And the court has no configured operating hours
- When I open the publish slots flow
- Then I see an alert that hours are required
- And I can click a link/button to configure court hours

### Missing Pricing Rules Shows A Clear Alert

- Given I am trying to publish slots for a specific court
- And the court has no configured pricing rules
- When I open the publish slots flow
- Then I see an alert that pricing rules are required
- And I can click a link/button to configure pricing rules

### Publishing Slots Uses Court Pricing Rules

- Given I have configured court hours and pricing rules
- When I publish 60-minute slots for that court
- Then slots are created successfully
- And the slot prices shown to players are derived from the configured pricing rules

### Free Pricing Is Supported Via Rules

- Given I want to offer free slots for a court
- When I set the hourly rate to 0 for a pricing window
- And I publish slots in that window
- Then those slots are treated as free by the system

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Pricing rules do not cover the selected publish time range | The owner is warned and guided to adjust pricing rules before publishing |
| Court hours do not cover the selected publish time range | The owner is warned and guided to adjust hours before publishing |
| Overnight windows are used (end < start) | The system supports configuration in a consistent way (e.g., split across days) |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Court hours, hourly pricing, slot publishing)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (CourtHoursWindow, CourtRateRule, TimeSlot)
