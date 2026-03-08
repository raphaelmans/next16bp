## ADDED Requirements

### Requirement: Discovery time filter supports multi-select hours
The public courts discovery time filter SHALL allow users to select multiple hour values in a single availability-aware search. The filter MUST present hours as a set of toggleable options from 6:00 AM to 11:00 PM.

#### Scenario: User selects multiple hours
- **WHEN** a user selects two or more hours in the discovery time filter (e.g. 18:00 and 19:00)
- **THEN** discovery returns venues that have at least one matching 60-minute option starting at any of the selected hours

#### Scenario: User selects a single hour
- **WHEN** a user selects exactly one hour in the discovery time filter
- **THEN** the behavior is identical to the previous single exact-time filter

#### Scenario: User deselects all hours
- **WHEN** a user deselects all selected hours so no hours remain active
- **THEN** the time filter is cleared and discovery falls back to date-only availability filtering

### Requirement: Multi-hour selection is encoded as an array in URL state
The discovery URL state SHALL encode selected hours as repeated `time` query parameters (e.g. `?time=18:00&time=19:00`). A URL with a single `time` value SHALL be treated as an array with one element.

#### Scenario: URL with multiple time values
- **WHEN** a user navigates to a discovery URL containing `?sportId=x&date=2026-03-10&time=18:00&time=19:00`
- **THEN** the discovery page loads with both 18:00 and 19:00 selected in the time filter and results filtered to venues matching either hour

#### Scenario: URL with a single time value
- **WHEN** a user navigates to a discovery URL containing `?sportId=x&date=2026-03-10&time=18:00`
- **THEN** the discovery page loads with 18:00 selected and results filtered to that hour

### Requirement: Multi-hour normalization removes invalid entries
The discovery filter normalization SHALL validate each hour in the array against the `HH:mm` pattern and discard invalid entries. If all entries are invalid, the time filter SHALL be treated as empty.

#### Scenario: Mixed valid and invalid time values
- **WHEN** URL state contains `time=18:00&time=invalid&time=19:00`
- **THEN** normalization keeps only `["18:00", "19:00"]` and discards the invalid entry

#### Scenario: All time values are invalid
- **WHEN** URL state contains only invalid time values
- **THEN** the time filter is treated as empty and discovery uses date-only filtering
