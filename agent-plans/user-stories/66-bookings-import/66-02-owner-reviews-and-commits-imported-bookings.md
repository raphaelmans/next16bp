# US-66-02: Owner Reviews and Commits Imported Bookings

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **review, edit, and commit imported bookings** so that **the platform blocks availability for those time ranges and my venue schedule reflects reality**.

---

## Acceptance Criteria

### Owner Can Correct Import Errors Before Commit

- Given I have an imported bookings draft
- When I view the draft
- Then I can edit bookings with invalid or missing data
- And I can remove erroneous bookings from the draft

### Commit Requires A Valid Draft

- Given the draft contains bookings with blocking errors
- When I attempt to commit the import
- Then the platform prevents commit
- And I see which rows must be fixed

### Imported Bookings Must Be Hour-Aligned (Current Constraint)

- Given I am reviewing imported bookings
- When a booking start/end time is not aligned to the hour grid (minute 0) or the duration is not a multiple of 60 minutes
- Then the row is flagged as an error
- And I must correct the time range before commit

### Committing Prevents Double-Booking

- Given I commit a valid imported bookings draft
- Then the imported bookings are stored
- And players cannot book time ranges that overlap the imported bookings

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Draft contains duplicate bookings | Duplicates are flagged or skipped with a clear summary |
| Draft booking overlaps an existing booking/block | Owner is warned and the platform prevents double-booking |
| Commit partially succeeds | Owner sees a clear results summary (created vs skipped vs invalid) |
| Imported booking is not hour-aligned | Booking cannot be committed until corrected |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Court | select | Yes |
| Start Time | datetime | Yes |
| End Time | datetime | Yes |
| Reason/Label | text | No |

---

## References

- Related: `agent-plans/65-rules-exceptions-cutover/65-00-overview.md`
