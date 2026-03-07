## ADDED Requirements

### Requirement: Player reservation route SHALL be canonical
The system SHALL use `/reservations/[id]` as the only player reservation route and SHALL not require a separate `/reservations/[id]/payment` route to complete a player reservation flow.

#### Scenario: Payable reservation opens on canonical route
- **WHEN** a player creates or opens a reservation that still requires player payment
- **THEN** the system MUST route the player to `/reservations/[id]`
- **AND** the system MUST render the reservation page in payment state without navigating to `/reservations/[id]/payment`

#### Scenario: Non-payable reservation opens on canonical route
- **WHEN** a player creates or opens a reservation that does not require player payment
- **THEN** the system MUST route the player to `/reservations/[id]`
- **AND** the system MUST render the reservation overview state

### Requirement: Player reservation page SHALL preserve a consistent layout shell
The system SHALL keep a consistent reservation page shell across overview, payment, loading, and terminal states so the player experience does not flicker or jump during navigation and status changes.

#### Scenario: Payment state reuses the same shell
- **WHEN** a player opens a payable reservation on `/reservations/[id]`
- **THEN** the system MUST keep the same page-level header and shell structure used by the reservation overview
- **AND** the system MUST render payment content inline without redirecting to a different layout

#### Scenario: Loading state matches the final layout
- **WHEN** the canonical reservation page is loading
- **THEN** the system MUST render loading placeholders that preserve the expected page structure
- **AND** the system MUST minimize layout shift when reservation content resolves

#### Scenario: Realtime status updates do not remount the page shell
- **WHEN** the reservation status changes while the player is viewing `/reservations/[id]`
- **THEN** the system MUST update the relevant reservation content in place
- **AND** the system MUST avoid unnecessary remounting of unrelated layout sections

### Requirement: Reservation page SHALL use URL-driven payment step state
The system SHALL represent player payment state on the canonical reservation page with URL step state and SHALL derive the effective step from reservation status.

#### Scenario: Explicit payment step remains valid while payment is required
- **WHEN** a player opens `/reservations/[id]?step=payment` for a reservation in a payable state
- **THEN** the system MUST render payment UI on the canonical reservation page

#### Scenario: Invalid payment step normalizes away from payment UI
- **WHEN** a player opens `/reservations/[id]?step=payment` for a reservation that is no longer payable
- **THEN** the system MUST normalize the page to the correct non-payment state
- **AND** the system MUST not keep stale payment UI visible

### Requirement: Linked payable reservations SHALL complete payment from the canonical page
The system SHALL support linked or grouped payable reservations from the same canonical reservation route and SHALL not require a separate payment page for linked payment flows.

#### Scenario: Linked reservation payment renders inline
- **WHEN** a player opens a reservation whose linked reservations contain payable items
- **THEN** the system MUST render the linked/group payment experience from `/reservations/[id]`
- **AND** the system MUST keep the player on that route during payment submission

#### Scenario: Linked reservation without payable items falls back to overview
- **WHEN** a player opens a linked reservation that has no payable items awaiting payment
- **THEN** the system MUST render the reservation overview state
- **AND** the system MUST not expose a broken payment step

### Requirement: Player reservation detail reads SHALL be player-scoped
The system SHALL only return player reservation detail data to the authenticated player who owns that reservation.

#### Scenario: Reservation owner can load detail
- **WHEN** the authenticated player requests detail for their own reservation
- **THEN** the system MUST return the canonical reservation detail response

#### Scenario: Non-owner cannot load detail
- **WHEN** the authenticated player requests detail for a reservation they do not own
- **THEN** the system MUST reject the request
