# Reservation Group Booking

## Purpose

Define grouped multi-court reservation behavior so players can submit multiple items atomically and owners can process grouped items as a single operational decision.

## Requirements

### Requirement: Player can create grouped multi-court reservations
The system SHALL allow a player to create a reservation group containing multiple reservation items in a single request for one place, where each item may have a different start time and duration.

#### Scenario: Multi-court create succeeds
- **WHEN** a player submits two or more valid reservation items for courts in the same place
- **THEN** the system creates one reservation group and one reservation row per item atomically

#### Scenario: Mixed-time items are allowed
- **WHEN** a player submits reservation items with different start times or durations
- **THEN** the system accepts the request if each item is individually valid and available

### Requirement: Group create is atomic
The system MUST enforce all-or-nothing persistence for grouped reservation creation.

#### Scenario: One item unavailable at commit time
- **WHEN** one reservation item becomes unavailable during transactional recheck
- **THEN** the system creates no reservation group and no child reservation rows

### Requirement: Owner handles grouped reservations as one decision
The system SHALL provide owner actions that transition grouped reservation items atomically for accept/reject/confirm flows.

#### Scenario: Owner accepts group
- **WHEN** an owner accepts a grouped reservation request
- **THEN** all actionable child reservations transition together according to pricing and policy rules

#### Scenario: Owner group action fails on one child
- **WHEN** any child reservation fails validation for the requested group action
- **THEN** no child reservation status is changed

### Requirement: Group reads expose child reservations
The system SHALL return reservation group details with child reservation items for player and owner detail/list use cases.

#### Scenario: Group detail query
- **WHEN** a client requests reservation group detail
- **THEN** the response includes group metadata and ordered child reservation items

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
