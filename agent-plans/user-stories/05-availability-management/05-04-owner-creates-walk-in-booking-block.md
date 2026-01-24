# US-05-04: Owner Creates Walk-In Booking Block (Skip Reservation Flow)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner/front-desk admin**, I want to **reserve a court time range as a walk-in booking (without using the reservation flow)** so that **non-technical walk-in customers can be accommodated quickly**.

---

## Acceptance Criteria

### Create a Walk-In Booking Block

- Given I am an authenticated organization owner
- And I am on the owner court availability page
- When I create a walk-in booking for a start datetime and end datetime
- Then the time range becomes unavailable immediately (owner + public availability)
- And the system stores a price snapshot for analytics (gross revenue)
- And the price is computed from the current schedule rules (no manual override)
- And the time zone used is the place time zone

### Duration Rules (Consistent With Player Booking)

- Given I create a walk-in booking
- When the duration is not a multiple of 60 minutes
- Then the system rejects the request with a clear validation message

### Remove a Walk-In Booking Block

- Given a walk-in booking block exists
- When I remove/cancel it
- Then the court becomes available again for that time range
- And the system preserves the record for analytics/auditing (not hard delete)

### No Overlaps (Hard Rule)

- Given I attempt to create a walk-in booking block
- When the time range overlaps any existing active reservation (CREATED/AWAITING_PAYMENT/PAYMENT_MARKED_BY_USER/CONFIRMED)
- Or overlaps an existing active block
- Then the system rejects the request with a clear conflict error

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Schedule rules do not cover the intended time range | Walk-in creation is blocked with guidance to update schedule/pricing |
| End time is before or equal to start time | Walk-in creation is blocked |
| Block spans midnight | Allowed; it affects both days |
| Owner tries to book a court they do not own | Forbidden |

---

## Form Fields

| Field | Type | Required |
|------|------|----------|
| Start datetime | datetime | Yes |
| End datetime | datetime | Yes |
| Note | text | No |

---

## References

- PRD v1.2: Section 9 (pricing rules concept)
- Cutover: `agent-contexts/01-05-rules-exceptions-cutover.md`
