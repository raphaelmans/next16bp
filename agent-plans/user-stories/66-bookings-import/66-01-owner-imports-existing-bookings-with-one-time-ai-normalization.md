# US-66-01: Owner Imports Existing Bookings With One-Time AI Normalization

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **upload an export of my already-booked reservations and run AI normalization once** so that **I can quickly generate a draft of bookings that matches KudosCourts' data structure and prevents double-booking**.

---

## Acceptance Criteria

### Owner Uploads A Booking Export

- Given I am an owner managing a specific venue
- When I upload a calendar/spreadsheet export of existing bookings
- Then the platform accepts the file
- And I see a preview summary (e.g., count, date range, detected fields)

### AI Normalization Requires Explicit One-Time Confirmation

- Given I have not used AI normalization for this venue before
- When I choose to run AI normalization
- Then I see a clear warning that AI normalization can only be run once for this venue
- And I must explicitly confirm before the platform proceeds

### AI Produces A Draft That Matches The Platform Data Structure

- Given AI normalization succeeds
- Then I see a draft list of bookings in a UI that matches the platform structure
- And each booking is represented as a row with court, start time, end time, and a reason/label
- And any rows with missing/invalid data are clearly marked as errors

### AI Normalization Is Not Available After The First Use

- Given AI normalization has already been used for this venue
- When I return to the import flow
- Then I cannot run AI normalization again
- And I am guided to review/edit the existing draft or proceed without AI

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Unsupported file type | Show a clear validation error and do not proceed |
| File contains no bookings | Show an empty state and guidance on supported formats |
| Bookings cannot be mapped to a specific court | Row is flagged as an error until the owner selects a court |
| Invalid time ranges (end <= start) | Row is flagged as an error until corrected |
| AI output is incomplete or inconsistent | Rows are flagged for owner correction; the draft remains editable |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Upload File | file | Yes |
| One-Time Confirmation | checkbox/text | Yes |

---

## References

- Related: `agent-contexts/01-05-rules-exceptions-cutover.md`
