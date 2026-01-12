# US-14-03: Player Chooses Duration In 60-Minute Increments

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **choose a booking duration in 60-minute increments** so that **I can book longer sessions while keeping pricing and availability predictable**.

---

## Acceptance Criteria

### Default Duration Is 60 Minutes

- Given I’m starting a booking flow for a court
- When I view duration options
- Then the default duration is 60 minutes

### Duration Options Are Multiples Of 60

- Given I’m selecting a duration
- When I change the duration
- Then the selectable durations are multiples of 60 minutes (e.g., 60/120/180)

### Longer Durations Require Continuous Availability

- Given I select a duration greater than 60 minutes
- When I pick a start time
- Then the system only allows booking if the full duration is available for that court

### Price Updates With Duration

- Given the court is paid
- When I change the duration
- Then the displayed total price updates to reflect the selected duration

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Court has availability gaps | UI prevents selecting durations that can’t be satisfied |
| Pricing windows change during the selected duration | Total price reflects the rules for each hour segment (documented behavior) |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Slot granularity and hourly pricing)
- ERD: `business-contexts/kudoscourts-erd-specification-v1.2.md` (CourtRateRule, TimeSlot)
