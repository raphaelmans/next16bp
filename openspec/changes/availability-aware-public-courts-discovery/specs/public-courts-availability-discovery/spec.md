## ADDED Requirements

### Requirement: Public courts discovery supports sport-gated availability filters
The public `/courts` discovery experience SHALL support availability-aware filtering with province, city, sport, date, and an optional exact start time. Availability-aware filtering MUST only activate when a sport is selected.

#### Scenario: User selects a sport and date
- **WHEN** a user selects a sport and a date on the public courts discovery page
- **THEN** the discovery results are recalculated using the selected location filters and the requested date

#### Scenario: User selects a date or time without a sport
- **WHEN** discovery filter state contains a date or time but no selected sport
- **THEN** the availability-aware filtering inputs are ignored and discovery falls back to the non-availability result set

#### Scenario: User clears the date filter
- **WHEN** a user clears the selected date from the discovery filters
- **THEN** the optional exact time filter is also cleared and discovery returns to the non-availability result set for the remaining filters

### Requirement: Availability-aware discovery only returns matching venues
When availability-aware filtering is active, the public courts discovery result set SHALL only include venues that have at least one matching 60-minute bookable option for the selected sport and requested date or exact start time.

#### Scenario: Date-only availability filtering
- **WHEN** a user searches public discovery with a sport and a date but no exact time
- **THEN** discovery only returns venues that have at least one matching 60-minute option on that date

#### Scenario: Exact-time availability filtering
- **WHEN** a user searches public discovery with a sport, a date, and an exact start time
- **THEN** discovery only returns venues that have at least one matching 60-minute option starting at that exact time

#### Scenario: No venue matches the requested availability
- **WHEN** no venue has a matching 60-minute option for the selected sport, date, and optional exact time
- **THEN** discovery renders an empty-results state for that availability request

### Requirement: Matching discovery cards show an availability preview
The public discovery list SHALL show an availability preview for each venue returned by an availability-aware search so players can compare matching venues without opening each venue detail page.

#### Scenario: Date-only search preview
- **WHEN** a venue matches a date-only availability-aware search
- **THEN** its discovery card shows the earliest matching start time for that date and a count of matching options

#### Scenario: Exact-time search preview
- **WHEN** a venue matches an exact-time availability-aware search
- **THEN** its discovery card shows the matched exact start time and a count of matching options for that request

### Requirement: Availability-filtered discovery remains a shared list and map dataset
Availability-aware discovery SHALL keep list and map views on the same filtered venue dataset so switching views does not change the active result set.

#### Scenario: Switching from list to map during an availability-aware search
- **WHEN** a user switches from list to map while date-aware discovery filters are active
- **THEN** the map view uses the same availability-filtered venues as the list view

#### Scenario: First-page load with availability-aware filters
- **WHEN** a user requests a public courts discovery URL that contains valid availability-aware filters
- **THEN** the first page of matching venues is available through the hydrated discovery dataset for that request
