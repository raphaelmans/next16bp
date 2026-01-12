# US-14-11: Owner Filters Slots/Reservations By Place And Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **filter slot management and reservations by place and court** so that **I can operate venues with many courts efficiently**.

---

## Acceptance Criteria

### Owner Can Filter By Place

- Given I manage multiple places
- When I open owner slot or reservation tools
- Then I can filter/select a place

### Owner Can Filter By Court Within Place

- Given I selected a place
- When I filter further
- Then I can choose a specific court to manage

### Filters Are Reflected In Displayed Data

- Given I selected filters
- When the page loads or refreshes
- Then only slots/reservations for the selected place/court appear

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Selected court becomes inactive | UI informs owner and prompts to select another court |
| User has no places/courts yet | UI shows an empty state with a clear next action |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Owner workflows)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (Place/Court relationships)
