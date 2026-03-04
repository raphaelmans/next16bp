## MODIFIED Requirements

### Requirement: Group notifications route to group handling surfaces
Notification delivery for grouped bookings SHALL route users to grouped-booking handling surfaces rather than per-item reservation detail routes.

#### Scenario: Player receives grouped lifecycle push notification
- **WHEN** a grouped booking player receives a reservation-group lifecycle notification
- **THEN** the notification deep link resolves to the player grouped-booking handling surface using the representative reservation and status-aware route semantics

#### Scenario: Owner receives grouped lifecycle push notification
- **WHEN** an owner receives a grouped booking lifecycle notification
- **THEN** the notification deep link resolves to `/organization/reservations/{representativeReservationId}` for owner handling
- **AND** owner grouped lifecycle notifications do not deep-link to `/organization/reservations/group/{reservationGroupId}`
