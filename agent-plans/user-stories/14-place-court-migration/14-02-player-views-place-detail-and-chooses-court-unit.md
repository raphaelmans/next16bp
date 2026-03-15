# US-14-02: Player Views Place Detail And Chooses Court Unit

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **view a place’s courts and choose a specific court** so that **I know exactly which physical court I am booking**.

---

## Acceptance Criteria

### Place Detail Shows Courts

- Given I open a reservable place detail page
- When the page loads
- Then I can see a list of courts at the place

### Court List Shows Sport And Tier Label

- Given courts are displayed
- When I view a court row/card
- Then I can see the court’s sport and optional tier label (e.g., Premium)

### Court Selection Drives Availability

- Given I select a specific court
- When I view availability
- Then the slot list reflects availability for that court

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Court is inactive | Court is not selectable |
| Place is curated (view-only) | Court list may be shown as informational, but booking UI is not available |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Place detail, court selection)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (Place→Court, Court→Sport)
