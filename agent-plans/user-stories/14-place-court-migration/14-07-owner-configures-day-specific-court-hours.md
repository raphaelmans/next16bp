# US-14-07: Owner Configures Day-Specific Court Hours (Incl. Overnight)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **configure day-specific operating hours for each court (including overnight)** so that **availability reflects real operations and bookings only happen during open windows**.

---

## Acceptance Criteria

### Owner Sets Weekly Hours Per Court

- Given I am managing a specific court
- When I configure operating hours
- Then I can set hours per day-of-week

### Supports Multiple Windows And Breaks

- Given I am configuring hours for a day
- When I add more than one window (e.g., morning + evening)
- Then both windows are saved and reflected in availability guidance

### Supports Overnight By Splitting Across Days

- Given I want to set an overnight window (e.g., 22:00–02:00)
- When I save operating hours
- Then the system stores the schedule in a way that represents that overnight availability

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Court has no hours for a day | That day is treated as closed (not bookable) |
| Invalid window (end before start) | Owner is prevented from saving and sees a clear message |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Court-unit hours)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (CourtHoursWindow)
