## MODIFIED Requirements

### Requirement: Reservation owner operations SHALL be authorized by organization permissions
The system SHALL authorize owner-portal reservation operations for users who are either canonical owners or active members with required reservation permissions.

#### Scenario: Manager accepts reservation
- **WHEN** a user is an active member of the reservation's organization with `reservation.update_status`
- **THEN** owner reservation accept/reject/confirm-payment operations succeed

#### Scenario: Viewer blocked from mutating reservation operations
- **WHEN** a user has organization membership but lacks `reservation.update_status`
- **THEN** mutating owner reservation operations return forbidden

### Requirement: Guest booking and pending reads SHALL be permission-gated
The system SHALL gate owner guest-booking actions and owner reservation read views by explicit permissions.

#### Scenario: Manager creates guest booking
- **WHEN** an active member has `reservation.guest_booking`
- **THEN** guest booking creation and walk-in conversion operations are authorized

#### Scenario: Member without reservation.read cannot access owner reservation list
- **WHEN** an active member lacks `reservation.read`
- **THEN** owner reservation list/detail reads return forbidden
