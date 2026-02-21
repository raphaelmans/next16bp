## ADDED Requirements

### Requirement: Notification Derived State Is Pure

Notification diagnostics and toggle eligibility logic SHALL be implemented as pure functions in feature-local domain files.

#### Scenario: Diagnostics derivation

- **GIVEN** notification support, secure-context, permission, configuration, and subscription inputs
- **WHEN** diagnostics derivation is executed
- **THEN** diagnostics code and message are deterministic for the same inputs

#### Scenario: Toggle eligibility derivation

- **GIVEN** notification capability and busy-state inputs
- **WHEN** toggle eligibility derivation is executed
- **THEN** disabled/enabled output is deterministic and independent from UI runtime concerns

### Requirement: Notification UI Uses Domain Outputs

Notification components and hooks SHALL consume domain-derived outputs rather than embedding duplicated inline conditional chains.

#### Scenario: NotificationBell state rendering

- **GIVEN** domain-derived notification state
- **WHEN** NotificationBell renders
- **THEN** displayed status text and toggle state are sourced from domain outputs
- **AND** component code remains focused on presentation and user actions
