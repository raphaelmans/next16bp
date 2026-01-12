# US-14-01: Player Discovers Places With Sport Filters

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **discover places near me and filter by sport** so that **I can quickly find a venue that supports the sport I want to play**.

---

## Acceptance Criteria

### Place Discovery Supports Sport Filtering

- Given I am browsing discovery results
- When I apply a sport filter (e.g., Pickleball, Basketball)
- Then the list/map shows places that have at least one court for that sport

### Place Card Communicates Sports Available

- Given a place appears in discovery results
- When I view the place card
- Then I can see which sports are available at that place

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place has no active courts for a sport | Place does not appear for that sport filter |
| Sport data is incomplete during migration | Place still appears, but sport badges are omitted and UI remains usable |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Discovery & Availability)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (Place, Sport, Court)
