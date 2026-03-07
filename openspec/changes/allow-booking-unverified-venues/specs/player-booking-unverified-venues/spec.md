## ADDED Requirements

### Requirement: Public Booking Eligibility SHALL Not Require Verified Status
The system SHALL allow player booking for reservable venues regardless of whether the place verification status is `UNVERIFIED`, `PENDING`, `REJECTED`, or `VERIFIED`, as long as reservations are enabled and the venue remains otherwise bookable.

#### Scenario: Unverified venue remains bookable when reservations are enabled
- **WHEN** a player opens a reservable venue whose verification status is `UNVERIFIED`
- **THEN** the system MUST allow booking flows to remain available if `reservationsEnabled` is true and payment-method requirements are satisfied

#### Scenario: Pending venue remains bookable when reservations are enabled
- **WHEN** a player opens a reservable venue whose verification status is `PENDING`
- **THEN** the system MUST allow booking flows to remain available if `reservationsEnabled` is true and payment-method requirements are satisfied

#### Scenario: Rejected venue remains bookable when reservations are enabled
- **WHEN** a player opens a reservable venue whose verification status is `REJECTED`
- **THEN** the system MUST allow booking flows to remain available if `reservationsEnabled` is true and payment-method requirements are satisfied

### Requirement: Non-Verified Booking Surfaces SHALL Show Informational Warnings
The system SHALL replace non-verified booking blocks with an informational warning banner on booking surfaces so players can proceed with booking while understanding the venue has not been verified.

#### Scenario: Place booking surface shows warning without blocking booking
- **WHEN** a player views a non-verified reservable venue on a public place-detail booking surface
- **THEN** the system MUST render a warning banner describing the current verification state
- **AND** the system MUST keep the booking controls available

#### Scenario: Court booking surface shows warning without blocking booking
- **WHEN** a player views a non-verified reservable venue through a direct court booking flow
- **THEN** the system MUST render a warning banner describing the current verification state
- **AND** the system MUST keep the booking controls available

#### Scenario: Direct booking page shows warning without fallback lockout
- **WHEN** a player enters a non-verified reservable venue through a direct booking or checkout page
- **THEN** the system MUST render a warning banner describing the current verification state
- **AND** the system MUST not replace the page with a generic "bookings not available" fallback solely because the venue is not verified

### Requirement: Verification Warning Scope SHALL Be Limited To Booking Surfaces
The system SHALL confine the non-verified warning to surfaces where the player is deciding or confirming a booking, rather than expanding the warning to general public venue browsing surfaces.

#### Scenario: General public venue browsing does not gain extra warning chrome
- **WHEN** a player browses non-booking public venue surfaces for a non-verified venue
- **THEN** the system MUST not introduce additional verification warning banners outside the booking surfaces defined for this capability
