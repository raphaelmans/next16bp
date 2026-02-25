## ADDED Requirements

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
