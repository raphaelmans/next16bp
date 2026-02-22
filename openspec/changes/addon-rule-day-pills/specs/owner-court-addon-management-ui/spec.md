## Purpose

Delta spec for the owner add-on management UI. The rule window interaction model changes from a per-day dropdown row to a multi-select day pill row. All other requirements from the base spec are unchanged.

## MODIFIED Requirements

### Requirement: Owner add-on rules SHALL provide overlap-safe editing affordances
The add-on rule editor SHALL use multi-select day pill buttons (`Su M T W Th F Sa`) instead of a single-day dropdown for rule window entry, and SHALL surface overlap, invalid-window, and empty-day-selection validation feedback aligned with backend validation semantics.

#### Scenario: Owner enters overlapping windows for the same add-on day via pills
- **WHEN** the owner creates two rule rows that both include the same day pill and whose time ranges overlap (e.g. `Mon 09:00–17:00` and `Mon 14:00–22:00`)
- **THEN** the UI displays blocking validation feedback on both rows and prevents successful save until the conflict is resolved

#### Scenario: Owner configures a multi-day rule with pills
- **WHEN** the owner toggles M/T/W/Th/F day pills on a single rule row with a valid time range and rate
- **THEN** the rule is saved as 5 per-day DB rows and reloaded as a single pill row with the same 5 days selected

#### Scenario: Owner clears all day pills on a row
- **WHEN** the owner deselects all day pills on an existing rule row
- **THEN** the editor shows "Select at least one day" inline and the save button is disabled
