## Purpose

Define grouped-booking notification contracts and routing so lifecycle events are emitted and delivered at reservation-group level while keeping single-reservation behavior intact.

## Requirements

### Requirement: Grouped reservation lifecycle emits group-level notification events
The notification delivery system SHALL emit reservation-group lifecycle events for grouped bookings, with payloads keyed by `reservationGroupId`.

#### Scenario: Group creation event
- **WHEN** a grouped booking is created successfully
- **THEN** the system enqueues a group-level creation notification event with group metadata and itemized summary fields
- **AND** idempotency keys are scoped to group lifecycle event identity

#### Scenario: Group lifecycle transition events
- **WHEN** grouped booking lifecycle transitions occur (for example awaiting payment, payment marked, confirmed, rejected, cancelled)
- **THEN** the system enqueues corresponding group-level notification events for grouped flows

### Requirement: Group notifications route to group handling surfaces
Notification delivery for grouped bookings SHALL route users to reservation-group handling surfaces rather than per-item reservation detail routes.

#### Scenario: Player receives grouped lifecycle push notification
- **WHEN** a grouped booking player receives a reservation-group lifecycle notification
- **THEN** the notification deep link resolves to a reservation-group player surface

#### Scenario: Owner receives grouped lifecycle push notification
- **WHEN** an owner receives a grouped booking lifecycle notification
- **THEN** the notification deep link resolves to a reservation-group owner handling surface

### Requirement: Single-booking notification contracts remain valid
The notification delivery system SHALL preserve existing reservation-item event contracts for non-grouped bookings.

#### Scenario: Single reservation lifecycle event
- **WHEN** a non-grouped reservation lifecycle event is emitted
- **THEN** the system continues to use existing `reservation.*` notification contracts and routing semantics
