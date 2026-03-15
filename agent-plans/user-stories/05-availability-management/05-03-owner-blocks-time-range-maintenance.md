# US-05-03: Owner Blocks Court Time Range (Maintenance)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **block a specific time range on a court** so that **players cannot book during maintenance or private events**.

---

## Acceptance Criteria

### Create a One-Off Maintenance Block

- Given I am an authenticated organization owner
- And I am on the owner court availability page
- When I create a maintenance block with a start datetime and end datetime
- Then the blocked time range becomes unavailable immediately (owner + public availability)
- And the block is saved with an optional reason (e.g. "Net replacement", "Private event")
- And the times are interpreted using the place time zone

### View Blocks

- Given blocks exist for the selected court
- When I view the availability page
- Then I can see existing blocks for the currently visible date range

### Remove a Block

- Given a maintenance block exists
- When I remove/cancel the block
- Then the court becomes available again for that time range
- And the system preserves the block record for analytics/auditing (not hard delete)

### No Overlaps (Hard Rule)

- Given I attempt to create a maintenance block
- When the time range overlaps any existing active reservation (CREATED/AWAITING_PAYMENT/PAYMENT_MARKED_BY_USER/CONFIRMED)
- Or overlaps an existing active block
- Then the system rejects the request with a clear conflict error

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| End time is before or equal to start time | Block save is prevented with a clear validation message |
| Block spans midnight | Allowed; it affects both days |
| Owner tries to block a court they do not own | Forbidden |
| Network error | User-safe error + retry |

---

## Form Fields

| Field | Type | Required |
|------|------|----------|
| Start datetime | datetime | Yes |
| End datetime | datetime | Yes |
| Reason | text | No |

---

## References

- PRD v1.2: Section 9 (blocking concept)
- Cutover: `agent-contexts/01-05-rules-exceptions-cutover.md`
