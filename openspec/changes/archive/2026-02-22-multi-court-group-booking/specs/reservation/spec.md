## ADDED Requirements

### Requirement: Reservation may belong to a reservation group
The system SHALL support optional reservation grouping while preserving all existing single-reservation behavior.

#### Scenario: Legacy reservation remains valid
- **WHEN** a reservation has no group identifier
- **THEN** all existing player and owner flows behave as before

#### Scenario: Grouped reservation item
- **WHEN** a reservation is created as part of a grouped request
- **THEN** the reservation row stores a group identifier linked to its parent group

### Requirement: Grouped creation endpoint coexists with existing endpoints
The system SHALL expose grouped reservation create APIs without removing or breaking existing create-for-court and create-for-any-court APIs.

#### Scenario: Existing createForCourt contract
- **WHEN** a client calls the single-court create endpoint
- **THEN** the endpoint response and status semantics remain backward compatible

#### Scenario: Existing createForAnyCourt contract
- **WHEN** a client calls the any-court create endpoint
- **THEN** the endpoint response and status semantics remain backward compatible
