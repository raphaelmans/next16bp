## ADDED Requirements

### Requirement: Grouped owner lifecycle notifications SHALL use opt-in recipient fan-out
Owner-side grouped reservation lifecycle notifications SHALL use the same
organization opt-in routing model as single reservation owner-side notifications.

#### Scenario: Grouped lifecycle owner event fans out to enabled recipients
- **WHEN** a grouped reservation owner-side lifecycle event is emitted
- **THEN** delivery jobs are enqueued for each organization recipient that is
  eligible and opted in
- **AND** each recipient routes to the grouped owner handling surface

#### Scenario: Grouped lifecycle owner event with no enabled recipients
- **WHEN** grouped owner-side lifecycle delivery runs for an organization with
  zero enabled recipients
- **THEN** no owner-side grouped notification jobs are enqueued
- **AND** grouped lifecycle processing continues without implicit owner fallback
