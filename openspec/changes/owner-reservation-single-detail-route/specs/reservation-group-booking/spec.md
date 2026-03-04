## MODIFIED Requirements

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

#### Scenario: Owner grouped booking opens canonical single-detail route
- **WHEN** an owner opens a grouped booking from owner reservation list, active reservations, alerts panel, notifications, or in-page detail links
- **THEN** the destination resolves to `/organization/reservations/{representativeReservationId}`
- **AND** grouped child items remain visible within that owner detail surface

#### Scenario: Legacy owner grouped-detail URL remains compatible
- **WHEN** an owner navigates to `/organization/reservations/group/{reservationGroupId}`
- **THEN** the system resolves the group's representative reservation
- **AND** redirects to `/organization/reservations/{representativeReservationId}`
