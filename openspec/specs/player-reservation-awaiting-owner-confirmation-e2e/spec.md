# player-reservation-awaiting-owner-confirmation-e2e Specification

## Purpose
TBD - created by archiving change player-reserve-single-slot-awaiting-owner-confirmation-e2e. Update Purpose after archive.
## Requirements
### Requirement: Authenticated player can reserve one reservable court slot via venue availability studio
The system SHALL allow an authenticated player to complete a single-slot booking from the venue availability studio by selecting one reservable start time for one court and proceeding to booking review.

#### Scenario: Player selects a reservable slot and proceeds to review
- **WHEN** an authenticated player opens a venue with reservable inventory and chooses `Book` + `Pick a court`
- **THEN** the player can select exactly one start slot for one court
- **AND** the player can proceed using the review CTA (`Continue to review` or equivalent)

### Requirement: Booking confirmation lands in awaiting owner confirmation state
The system SHALL persist a newly submitted player reservation in awaiting-owner-confirmation state and surface that state in reservation detail UI.

#### Scenario: Player confirms booking and sees awaiting-owner-confirmation indicators
- **WHEN** the player submits the booking from review with required terms accepted
- **THEN** the player is redirected to reservation detail
- **AND** the detail shows status badge contract `data-status="CREATED"`
- **AND** the detail shows "Owner review is in progress."
- **AND** the detail shows "Reservation requested"

### Requirement: Critical-path e2e MUST fail when no reservable slot is available
The e2e harness SHALL fail the player single-slot happy-path test with an explicit diagnostic error when no selectable slot can be found for the configured fixture venue.

#### Scenario: Fixture venue has no selectable slot
- **WHEN** the e2e booking flow cannot find a reservable slot after the defined mode/court/date selection attempts
- **THEN** the test fails with a clear message identifying the venue and missing availability condition

