## Purpose

Define organization member opt-in routing contracts for owner-side reservation
lifecycle notifications across channels and owner surfaces.

## Requirements

### Requirement: Reservation notification eligibility SHALL require permission and explicit opt-in
The system SHALL treat organization reservation-operations notification delivery as disabled by default and SHALL require both permission `reservation.notification.receive` and explicit per-organization opt-in before a user can receive owner-side reservation lifecycle notifications.

#### Scenario: Eligible member enables reservation notification routing
- **WHEN** an active organization member with permission `reservation.notification.receive` sets `reservationOpsEnabled` to `true`
- **THEN** the system persists an `organization_member_notification_preference` record for that organization and user
- **AND** subsequent preference reads return `enabled = true` and `canReceive = true`

#### Scenario: Ineligible member cannot opt in
- **WHEN** an active organization member without permission `reservation.notification.receive` attempts to enable `reservationOpsEnabled`
- **THEN** the system returns forbidden
- **AND** no enabled routing state is applied for that member

### Requirement: Owner-side reservation notification routing SHALL fan out only to enabled recipients
For owner-side reservation lifecycle events, recipient resolution SHALL be the intersection of active organization members who have permission `reservation.notification.receive` and have `reservationOpsEnabled = true` for the event organization.

#### Scenario: Multiple opted-in members receive the same owner lifecycle event
- **WHEN** two or more organization members are eligible and opted in
- **THEN** owner-side notification delivery enqueues recipient-scoped jobs for each enabled member for that lifecycle event
- **AND** each recipient uses that member's registered delivery channels

#### Scenario: No enabled recipients suppress owner-side notification jobs
- **WHEN** an organization has zero eligible opted-in members
- **THEN** owner-side notification enqueue operations complete without creating recipient jobs
- **AND** the system emits diagnostic logging for muted owner-side routing

### Requirement: Owner surfaces SHALL expose routing status and self-service control
The system SHALL expose APIs for current-user reservation notification preference and organization enabled-recipient count, and owner UI SHALL surface this state in settings and dashboard warning surfaces.

#### Scenario: Dashboard warns when owner-side routing is muted
- **WHEN** an owner dashboard loads organization routing status with `enabledRecipientCount = 0`
- **THEN** the dashboard shows a warning that reservation notifications are muted
- **AND** the warning links to the settings routing section anchor

#### Scenario: Settings toggle refreshes preference and routing status
- **WHEN** an eligible member toggles reservation notification preference in settings
- **THEN** the system persists the new preference state
- **AND** client queries for personal preference and routing status are invalidated and refetched
