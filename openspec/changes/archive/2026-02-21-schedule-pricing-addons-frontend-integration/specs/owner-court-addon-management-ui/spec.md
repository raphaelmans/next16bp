## ADDED Requirements

### Requirement: Owner court setup SHALL support add-on management
The owner court setup experience SHALL allow owners to load and save court add-ons through the existing owner frontend architecture chain (components -> hooks/adapters -> feature API -> tRPC transport).

#### Scenario: Owner opens add-on management for a court
- **WHEN** an owner opens schedule/setup for a valid court
- **THEN** the UI loads existing add-ons for that court and displays editable add-on configuration rows

### Requirement: Owner forms SHALL support mode and pricing-type specific fields
The add-on management UI SHALL support `OPTIONAL` and `AUTO` modes, and SHALL support `HOURLY` and `FLAT` pricing types with type-specific field entry and helper copy.

#### Scenario: Owner configures a FLAT add-on
- **WHEN** the owner selects `FLAT` pricing type
- **THEN** the UI requires flat fee amount and currency fields and persists them through save

### Requirement: Owner add-on rules SHALL provide overlap-safe editing affordances
The add-on rule editor SHALL support day/minute-window entry and SHALL surface overlap and invalid-window validation feedback aligned with backend validation semantics.

#### Scenario: Owner enters overlapping windows for same add-on day
- **WHEN** the owner creates overlapping rule windows for one add-on on the same day
- **THEN** the UI displays blocking validation feedback and prevents successful save until conflicts are resolved
