## ADDED Requirements

### Requirement: Owner notification routing UI state SHALL be derived by pure feature domain functions
The owner feature SHALL expose deterministic, pure functions that derive
reservation-notification routing view state from query and mutation inputs so
components can render without embedding branching logic.

#### Scenario: Routing settings state derivation is deterministic
- **WHEN** the same preference/routing query values and busy flags are provided
  to the domain function
- **THEN** the returned state shape is identical for every invocation
- **AND** UI conditions for permission hints and muted-routing warning are
  derived from returned flags instead of component-local branches

#### Scenario: Dashboard muted warning derivation is deterministic
- **WHEN** organization presence, loading state, and enabled-recipient count are
  provided to the domain function
- **THEN** the same warning visibility decision is returned for equivalent inputs
- **AND** muted warning is shown only when organization exists, loading is false,
  and enabled recipient count is zero

### Requirement: Organization notification recipient derivation SHALL be centralized in shared pure domain logic
Organization-member notification routing recipient selection SHALL be derived by
shared pure functions that compute eligible opted-in user ids and routing status
summary deterministically.

#### Scenario: Eligible and opted-in intersection
- **WHEN** eligible user ids and opted-in user ids are provided
- **THEN** the resulting recipient ids contain only users present in both sets
- **AND** duplicate ids are removed deterministically

#### Scenario: Routing status summary
- **WHEN** enabled recipient ids are provided for an organization
- **THEN** routing status returns matching `enabledRecipientCount`
- **AND** `hasEnabledRecipients` is true only when count is greater than zero

### Requirement: Reservation notification service-layer behavior SHALL have regression coverage for fan-out and muted paths
Service-layer tests SHALL cover owner-side reservation notification fan-out and
no-recipient muted behavior across single and grouped lifecycle events.

#### Scenario: Fan-out creates recipient-scoped jobs
- **WHEN** owner-side reservation lifecycle notification is enqueued with
  multiple opted-in recipients
- **THEN** service tests assert recipient-scoped idempotency and channel fan-out
  semantics
- **AND** tests verify inbox creation side effects per recipient

#### Scenario: Muted owner routing creates no jobs
- **WHEN** no opted-in recipients are resolved for owner-side lifecycle events
- **THEN** service tests assert zero job creation
- **AND** ping flow returns `pinged = false` and lifecycle enqueue flows return
  `jobCount = 0`
