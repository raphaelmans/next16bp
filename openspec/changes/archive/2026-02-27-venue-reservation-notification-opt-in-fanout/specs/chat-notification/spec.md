## ADDED Requirements

### Requirement: Owner reservation lifecycle notifications SHALL route through organization opt-in recipients
Owner-side reservation lifecycle notifications in this capability SHALL resolve
recipients from organization member notification routing instead of implicitly
targeting a single owner user.

#### Scenario: Reservation created owner notification fans out
- **WHEN** a reservation-created lifecycle event triggers owner-side
  notification delivery
- **THEN** the system sends owner-side delivery to each organization recipient
  currently eligible and opted in for reservation notifications
- **AND** no non-opted-in member receives that owner-side event

#### Scenario: Owner-side reservation lifecycle event with no enabled recipients
- **WHEN** owner-side reservation lifecycle delivery runs and no organization
  recipients are opted in
- **THEN** owner-side notification jobs are not enqueued
- **AND** processing completes without falling back to implicit owner delivery
