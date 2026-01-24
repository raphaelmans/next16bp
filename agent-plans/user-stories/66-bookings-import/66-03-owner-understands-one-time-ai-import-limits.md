# US-66-03: Owner Understands One-Time AI Import Limits

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **understand the one-time AI import limitation before I use it** so that **I can avoid accidental cost and choose the right time/file to normalize**.

---

## Acceptance Criteria

### AI Usage State Is Visible Per Venue

- Given I am viewing the bookings import flow for a venue
- Then I can see whether AI normalization is available or already used for that venue

### One-Time Warning Is Clear And Actionable

- Given AI normalization is available
- When I am about to run it
- Then I see a clear explanation that it is a one-time action
- And I must explicitly confirm before the platform runs AI

### After AI Is Used, Owner Is Guided Forward

- Given AI normalization has been used for a venue
- When I revisit the import experience
- Then I see when it was used
- And I am guided to review/edit the existing imported bookings without additional AI

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Multiple owners/admins manage the same venue | Once AI is used, all users see the same locked state |
| Owner uploads a new file after AI is already used | The platform does not offer AI normalization again and explains why |

---

## References

- Related: `agent-contexts/01-05-rules-exceptions-cutover.md`
