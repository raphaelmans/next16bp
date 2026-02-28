# player-court-booking-testing Specification

## Purpose
TBD - created by archiving change tdd-player-court-booking-testing. Update Purpose after archive.
## Requirements
### Requirement: Booking service SHALL enforce player booking constraints
Booking entrypoints SHALL reject requests that violate profile, place, availability, or pricing constraints.

#### Scenario: incomplete player profile is rejected
- **WHEN** a player profile lacks required booking contact fields
- **THEN** booking creation fails with a profile-completeness validation error
- **AND** reservation records are not created

#### Scenario: place is not bookable
- **WHEN** a place is not verified or reservations are disabled
- **THEN** booking creation fails with a place-not-bookable error

### Requirement: Group booking SHALL preserve pricing and consistency invariants
Grouped booking creation SHALL enforce currency and item consistency across all items.

#### Scenario: mixed currencies in group pricing
- **WHEN** grouped items compute to different currencies
- **THEN** group booking creation fails
- **AND** no group or reservation items are persisted

### Requirement: Reservation router SHALL expose stable booking transport contracts
Router procedures for player booking actions SHALL map domain errors to stable TRPC codes.

#### Scenario: booking conflict maps to bad request/constraint contract
- **WHEN** booking fails due to slot availability constraints
- **THEN** router returns the expected TRPC error code for the corresponding domain error

