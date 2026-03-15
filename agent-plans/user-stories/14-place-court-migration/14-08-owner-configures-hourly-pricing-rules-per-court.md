# US-14-08: Owner Configures Hourly Pricing Rules Per Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **set hourly pricing by day-of-week and time windows per court** so that **I can charge different rates for morning/afternoon/evening and overnight**.

---

## Acceptance Criteria

### Owner Sets Pricing Windows Per Court

- Given I am managing a specific court
- When I configure pricing
- Then I can set one or more price windows per day-of-week

### Pricing Is Expressed As An Hourly Rate

- Given I am setting a price window
- When I save the configuration
- Then the system stores an hourly rate and currency

### Zero-Rate Windows Represent Free

- Given I want to offer free slots for a time window
- When I set the hourly rate to 0
- Then that window is treated as free pricing for slot publishing and booking

### Pricing Supports Overnight

- Given I want a pricing rule that applies overnight
- When I save pricing rules
- Then the pricing can represent overnight periods in a consistent way

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Pricing windows overlap | Owner is prevented from saving overlaps (or overlaps require an explicit priority) |
| Pricing does not cover all open hours | Slots that fall outside coverage are not publishable (documented behavior) |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Hourly pricing)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (CourtRateRule)
