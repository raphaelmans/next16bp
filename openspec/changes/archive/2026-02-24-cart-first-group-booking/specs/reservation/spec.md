## MODIFIED Requirements

### Requirement: Grouped creation endpoint coexists with existing endpoints
The system SHALL expose grouped reservation contracts without removing or breaking existing create-for-court and create-for-any-court contracts.

#### Scenario: Existing createForCourt contract
- **WHEN** a client calls the single-court create endpoint
- **THEN** the endpoint response and status semantics remain backward compatible

#### Scenario: Existing createForAnyCourt contract
- **WHEN** a client calls the any-court create endpoint
- **THEN** the endpoint response and status semantics remain backward compatible

#### Scenario: Group-specific contracts are additive
- **WHEN** grouped clients use reservation-group read or payment contracts
- **THEN** those contracts are additive and keyed by `reservationGroupId`
- **AND** existing single-reservation read or payment contracts remain unchanged for non-group flows

## ADDED Requirements

### Requirement: Player can retrieve reservation-group detail from reservation domain contracts
The reservation domain SHALL provide a player-accessible reservation-group detail contract that returns group metadata and child reservation breakdown.

#### Scenario: Player fetches grouped reservation detail
- **WHEN** an authenticated player requests reservation-group detail for a group they own
- **THEN** the response includes reservation-group level totals, status context, and ordered child reservation items

#### Scenario: Unauthorized group access is rejected
- **WHEN** a player requests reservation-group detail for a group they do not own
- **THEN** the system rejects the request with an authorization error
