# US-14-10: Platform Migrates Existing Court Listings Into Place/Court Model

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **platform admin**, I want **existing data migrated into the new Place/Court model** so that **we can ship court-unit selection and multi-sport places without breaking existing users**.

---

## Acceptance Criteria

### Existing Listings Remain Discoverable

- Given the platform has existing “court” listings from the legacy model
- When migration is completed
- Then those listings remain discoverable as places

### Existing Reservations Remain Visible And Correct

- Given a player has an existing reservation
- When they view it after migration
- Then reservation details still show the correct venue and booked time

### Existing Slots Preserve Availability

- Given existing time slots exist
- When migration is completed
- Then those slots remain available/held/booked consistently with their prior state

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Partial migration / mixed data state | The application remains usable and avoids broken pages |
| Legacy listing cannot map cleanly | The system assigns a default court unit and marks missing details for owner/admin follow-up |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Migration intent and new model)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (Place/Court/TimeSlot)
