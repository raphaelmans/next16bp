## MODIFIED Requirements

### Requirement: Public courts discovery supports sport-gated availability filters
The public `/courts` discovery experience SHALL support availability-aware filtering with province, city, sport, date, and optional exact start times. Availability-aware filtering MUST only activate when a sport is selected. The time filter SHALL accept an array of `HH:mm` values instead of a single value.

#### Scenario: User selects a sport and date
- **WHEN** a user selects a sport and a date on the public courts discovery page
- **THEN** the discovery results are recalculated using the selected location filters and the requested date

#### Scenario: User selects a date or time without a sport
- **WHEN** discovery filter state contains a date or time but no selected sport
- **THEN** the availability-aware filtering inputs are ignored and discovery falls back to the non-availability result set

#### Scenario: User clears the date filter
- **WHEN** a user clears the selected date from the discovery filters
- **THEN** the optional time filter is also cleared and discovery returns to the non-availability result set for the remaining filters

### Requirement: Availability-aware discovery only returns matching venues
When availability-aware filtering is active, the public courts discovery result set SHALL only include venues that have at least one matching 60-minute bookable option for the selected sport and requested date or any of the requested start times.

#### Scenario: Date-only availability filtering
- **WHEN** a user searches public discovery with a sport and a date but no exact times
- **THEN** discovery only returns venues that have at least one matching 60-minute option on that date

#### Scenario: Multi-hour availability filtering
- **WHEN** a user searches public discovery with a sport, a date, and multiple selected hours
- **THEN** discovery only returns venues that have at least one matching 60-minute option starting at any of the selected hours

#### Scenario: No venue matches the requested availability
- **WHEN** no venue has a matching 60-minute option for the selected sport, date, and optional selected hours
- **THEN** discovery renders an empty-results state for that availability request

### Requirement: Matching discovery cards show an availability preview
The public discovery list SHALL show an availability preview for each venue returned by an availability-aware search so players can compare matching venues without opening each venue detail page.

#### Scenario: Date-only search preview
- **WHEN** a venue matches a date-only availability-aware search
- **THEN** its discovery card shows the earliest matching start time for that date and a count of matching options

#### Scenario: Multi-hour search preview
- **WHEN** a venue matches a multi-hour availability-aware search
- **THEN** its discovery card shows the earliest matching start time across the requested hours and a count of matching options for the request
