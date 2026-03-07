## ADDED Requirements

### Requirement: Owners SHALL Be Able To Enable Reservations For Non-Verified Venues
The system SHALL allow owners to enable reservations for reservable venues in `UNVERIFIED`, `PENDING`, `REJECTED`, and `VERIFIED` states. Enabling reservations SHALL continue to require at least one active payment method.

#### Scenario: Owner enables reservations for an unverified venue
- **WHEN** an owner enables reservations for a reservable venue whose verification status is `UNVERIFIED`
- **THEN** the system MUST persist `reservationsEnabled` as true if the organization has at least one active payment method

#### Scenario: Owner enables reservations for a pending or rejected venue
- **WHEN** an owner enables reservations for a reservable venue whose verification status is `PENDING` or `REJECTED`
- **THEN** the system MUST persist `reservationsEnabled` as true if the organization has at least one active payment method

#### Scenario: Enabling reservations still requires an active payment method
- **WHEN** an owner enables reservations for a venue without an active payment method
- **THEN** the system MUST reject the change even if the venue is otherwise eligible for booking

### Requirement: Reservation Toggle SHALL Materialize Missing Verification State
The system SHALL treat missing place-verification rows as an unverified state for reservation enablement and SHALL create or update the verification record when the owner toggles reservations.

#### Scenario: Enabling reservations creates an unverified verification record
- **WHEN** an owner enables reservations for a reservable venue that has no existing place-verification row
- **THEN** the system MUST create a place-verification record with status `UNVERIFIED`
- **AND** the system MUST persist `reservationsEnabled` as true

#### Scenario: Disabling reservations updates the persisted verification state
- **WHEN** an owner disables reservations for a reservable venue
- **THEN** the system MUST persist `reservationsEnabled` as false without changing the venue's verification status

### Requirement: Admin Rejection SHALL Preserve Reservation Toggle State
The system SHALL allow a venue to remain publicly bookable after verification rejection if reservations were already enabled, and SHALL preserve the existing reservation toggle state during rejection review updates.

#### Scenario: Rejecting an enabled venue keeps reservations available
- **WHEN** an admin rejects a verification request for a venue whose reservations are already enabled
- **THEN** the system MUST update the verification status to `REJECTED`
- **AND** the system MUST preserve `reservationsEnabled` as true

#### Scenario: Rejecting a disabled venue keeps reservations disabled
- **WHEN** an admin rejects a verification request for a venue whose reservations are disabled
- **THEN** the system MUST update the verification status to `REJECTED`
- **AND** the system MUST preserve `reservationsEnabled` as false
