# US-14-06: Owner Creates A Place With Multiple Courts

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **create a place listing and add multiple courts (each with a sport)** so that **I can represent my real venue structure and accept bookings per court**.

---

## Acceptance Criteria

### Owner Creates A Place Listing

- Given I am an authenticated organization owner
- When I create a new place
- Then the place is created with address/location details and is manageable in owner tools
- And latitude/longitude are optional fields

### Owner Adds Courts To A Place

- Given I have a place
- When I add a court to the place
- Then I can set:
  - court label (e.g., Court 1)
  - sport (e.g., Pickleball)
  - optional tier label (e.g., Premium)

### One Court Has One Sport

- Given I am creating or editing a court
- When I choose the sport
- Then the court is saved with exactly one sport

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Duplicate court label within a place | Owner is prevented from saving duplicates and sees a clear message |
| Place is inactive/deactivated | Courts cannot be booked by players |
| Coordinates omitted | Place is saved without map coordinates |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Owner needs, multi-sport places)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (Place, Court, Sport)
