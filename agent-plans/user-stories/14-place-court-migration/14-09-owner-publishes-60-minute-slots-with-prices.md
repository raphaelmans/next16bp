# US-14-09: Owner Publishes 60-Minute Slots With Prices

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **publish 60-minute availability slots for a specific court with correct pricing** so that **players can book reliably and see accurate prices**.

---

## Acceptance Criteria

### Slots Are Created In 60-Minute Increments

- Given I am creating slots for a court
- When I create or bulk-create slots
- Then each slot duration is a multiple of 60 minutes

### Slot Prices Are Available To Players

- Given a slot is available
- When a player views it
- Then the slot displays a price and currency (or clearly indicates free)

### Slot Prices Derive From Court Pricing Rules

- Given a court has configured hourly pricing rules
- When I publish slots without specifying per-slot prices
- Then the system derives each slot’s price from the configured pricing rules

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Owner creates overlapping slots | Creation is rejected with a clear error |
| Pricing rules do not cover the intended slot time | Slot publishing is prevented (or clearly blocked) with guidance to update pricing rules |
| Court hours do not cover the intended slot time | Slot publishing is prevented (or clearly blocked) with guidance to update court hours |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Time Slot Management)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (TimeSlot)
