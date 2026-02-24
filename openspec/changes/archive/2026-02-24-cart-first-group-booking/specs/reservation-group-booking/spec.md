## ADDED Requirements

### Requirement: Grouped booking lifecycle remains group-first after checkout
Grouped reservations SHALL be handled as one booking unit in primary player and owner lifecycle surfaces after successful group creation.

#### Scenario: Player lands on group detail after grouped checkout
- **WHEN** a player confirms a grouped booking with two or more items
- **THEN** the primary post-checkout flow presents a reservation-group detail surface keyed by `reservationGroupId`
- **AND** child reservation items are shown as itemized details inside that group surface

#### Scenario: Owner inbox uses grouped primary row
- **WHEN** an owner views reservations containing grouped bookings
- **THEN** each grouped booking appears as one primary actionable row/card
- **AND** child reservations are available as expandable itemized details without requiring separate primary actions per child row

### Requirement: Group payment submission is atomic at group level
The system SHALL support group-level payment submission for grouped bookings and SHALL apply payable-item transitions atomically.

#### Scenario: Group payment submission succeeds
- **WHEN** the player submits payment proof for a grouped booking where all payable child reservations are valid for transition
- **THEN** the system records one group payment submission action
- **AND** all payable child reservations transition to payment-marked state in one transaction

#### Scenario: Group payment submission fails for one child
- **WHEN** one payable child reservation fails transition validation during group payment submission
- **THEN** the system applies no payment-marked transition to any child reservation in that group
- **AND** the player receives a recoverable validation error for the group action
