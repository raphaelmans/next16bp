# US-66-04: Developer Normalizes External Bookings to Reservation Blocks (POC Script)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **KudosCourts developer**, I want to **run a local CLI script that converts external booking exports into reservation blocks** so that **we can quickly validate parsing and normalization against the platform schema before building the full owner import UI**.

---

## Acceptance Criteria

### Script Can Be Run Via pnpm

- Given I have a bookings export file on disk
- When I run `pnpm script:normalize-data -- --path=<path>`
- Then the script executes successfully
- And it prints the normalized output to stdout

### Supported Input Formats

- Given the provided file is a supported format (`.ics`, `.csv`, `.xlsx`)
- When I run the script
- Then the script parses the file without requiring manual pre-conversion

### Output Matches The Reservation Block Draft Schema

- Given the script parses the file
- When the script prints the normalized output
- Then the output includes a `blocks` array
- And the output includes a `resources` array describing detected courts/resources
- And each block references a `resourceId` that exists in `resources`
- And each block includes `startTime` and `endTime` as ISO datetimes
- And each block includes an optional `reason`

### Blocks Are Hour-Aligned (Current Constraint)

- Given the script outputs a normalized block
- Then the block duration is a multiple of 60 minutes
- And the start and end times are aligned to the hour grid in the configured time zone (minute 0)

### Validation And Error Reporting

- Given the input contains invalid rows/events
- When the script runs
- Then invalid entries are reported in an `errors` list
- And valid blocks are still returned in `blocks` (best-effort)

### Missing Or Unsupported File Handling

- Given the file path is missing or the file does not exist
- When I run the script
- Then I see a clear error message
- And the script exits with code 1

- Given the file format is unsupported
- When I run the script
- Then I see a clear error message
- And the script exits with code 1

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| End time is before or equal to start time | Entry is flagged as an error |
| Court cannot be resolved from input data | Entry is flagged as an error until a court mapping is provided |
| ICS recurrence rules | Recurrences are expanded within a bounded date range |
| Input uses a different timezone | Script applies a configured timezone fallback and outputs UTC ISO strings |
| Entry is not hour-aligned (minute != 0) or not a multiple of 60 minutes | Entry is flagged as an error |
| File contains bookings for multiple courts | Script outputs blocks for all detected courts/resources |

---

## CLI Inputs

| Flag | Type | Required |
|------|------|----------|
| --path | string | Yes |
| --format | enum (ics/csv/xlsx) | Yes |
| --time-zone | string | No |
| --range-start | datetime | No |
| --range-end | datetime | No |
| --model | string | No |
| --mapping-file | path | No |
| --save-mapping-file | path | No |
| --no-ai | boolean | No |

---

## References

- Related: `agent-plans/user-stories/66-bookings-import/66-01-owner-imports-existing-bookings-with-one-time-ai-normalization.md`
- Related: `src/shared/infra/db/schema/court-block.ts`
