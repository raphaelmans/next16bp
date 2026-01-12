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

### Slot Prices Can Be Overridden

- Given a court has hourly pricing rules
- When I set a specific slot price override
- Then the overridden price is used for that slot’s display and booking

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Owner creates overlapping slots | Creation is rejected with a clear error |
| Owner creates slot outside operating hours | Creation is rejected (or flagged) with a clear message |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Time Slot Management)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (TimeSlot)
