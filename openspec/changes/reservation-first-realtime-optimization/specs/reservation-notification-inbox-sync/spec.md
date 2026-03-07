## ADDED Requirements

### Requirement: In-App Reservation Inbox SHALL Stay Synchronized With Reservation Lifecycle
The in-app reservation notification inbox SHALL synchronize with reservation lifecycle changes through the shared reservation sync contract so that inbox-visible reservation state converges with reservation views and owner/player projections.

#### Scenario: Reservation event updates inbox-visible state
- **WHEN** a reservation lifecycle event produces or updates an in-app reservation notification
- **THEN** the affected inbox query scope MUST be updated or invalidated through the shared reservation sync layer
- **AND** the inbox-visible reservation state MUST converge with canonical reservation queries

#### Scenario: Reservation surfaces and inbox stay aligned
- **WHEN** an owner views both reservation surfaces and the in-app inbox for the same organization scope
- **THEN** pending or actionable reservation state shown in the inbox MUST converge with the owner reservation list, alerts, and counts for that scope

### Requirement: Async Delivery SHALL Remain Decoupled From UI Sync
The system SHALL treat asynchronous delivery channels such as email, SMS, and push as decoupled delivery infrastructure and SHALL NOT require delivery completion for canonical reservation UI state to synchronize.

#### Scenario: Delivery delay does not block reservation convergence
- **WHEN** asynchronous delivery of a reservation notification is delayed or retried
- **THEN** canonical reservation UI surfaces and the in-app inbox MUST still converge through reservation-domain synchronization
- **AND** delivery state MUST not block reservation query correctness

#### Scenario: Delivery failure does not corrupt reservation state
- **WHEN** an async notification delivery job fails
- **THEN** the failure MUST NOT mutate canonical reservation lifecycle state
- **AND** reservation reads MUST continue to synchronize from authoritative reservation data and inbox records

### Requirement: Inbox Sync SHALL Respect Authorized Scope
Reservation notification inbox synchronization SHALL only target inbox scopes that are authorized for the current viewer and relevant organization context.

#### Scenario: Authorized recipient scope only
- **WHEN** a reservation lifecycle event occurs in one organization scope
- **THEN** only inbox query scopes for authorized recipients of that organization MUST be patched or invalidated
- **AND** unrelated inbox scopes MUST remain untouched
