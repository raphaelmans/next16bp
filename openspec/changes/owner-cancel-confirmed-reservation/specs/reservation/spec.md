## MODIFIED Requirements

### Requirement: Reservation owner operations SHALL be authorized by organization permissions
The system SHALL authorize owner-portal reservation operations for users who are either canonical owners or active members with required reservation permissions. This includes accept, reject, confirm-payment, and cancel operations.

#### Scenario: Manager accepts reservation
- **WHEN** a user is an active member of the reservation's organization with `reservation.update_status`
- **THEN** owner reservation accept/reject/confirm-payment operations succeed

#### Scenario: Manager cancels confirmed reservation
- **WHEN** a user is an active member of the reservation's organization with `reservation.update_status`
- **THEN** owner reservation cancel operation on a `CONFIRMED` reservation succeeds

#### Scenario: Viewer blocked from mutating reservation operations
- **WHEN** a user has organization membership but lacks `reservation.update_status`
- **THEN** mutating owner reservation operations (including cancel) return forbidden
