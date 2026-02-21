## ADDED Requirements

### Requirement: Chat vs Notification Domain Separation

Chat unread/inbox domain logic SHALL remain in chat feature surfaces, while delivery-channel status/settings logic SHALL remain in notification feature surfaces.

#### Scenario: Chat unread updates

- **GIVEN** unread chat messages change
- **WHEN** app chat surfaces re-evaluate derived state
- **THEN** chat indicators update from chat domain logic
- **AND** notification domain logic is not used to compute chat unread state

#### Scenario: NotificationBell scope

- **GIVEN** user opens NotificationBell
- **WHEN** delivery capability and permissions are evaluated
- **THEN** bell displays delivery settings/status diagnostics only
- **AND** bell does not represent inbox thread state

### Requirement: Testability Boundary Contract

Deterministic chat and notification rules SHALL be verifiable by pure unit tests, while component tests SHALL focus on orchestration behavior.

#### Scenario: Pure rule verification

- **GIVEN** extracted domain/shared pure functions
- **WHEN** table-driven unit tests execute
- **THEN** invariants are validated without browser/network dependencies

#### Scenario: Component test scope

- **GIVEN** chat and notification UI tests
- **WHEN** components are tested
- **THEN** assertions focus on rendering and user interaction behavior
- **AND** deterministic rule branches are not redundantly re-tested in UI suites
