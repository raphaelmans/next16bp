## ADDED Requirements

### Requirement: Reservation notification delivery SHALL support deterministic fanout and muted behavior
Reservation lifecycle notification delivery SHALL create recipient-scoped jobs when eligible recipients are enabled and produce no jobs when routing is muted.

#### Scenario: owner lifecycle fanout with multiple opted-in recipients
- **WHEN** an owner reservation lifecycle event is enqueued and multiple eligible recipients are opted in
- **THEN** delivery jobs are created for each recipient/channel combination
- **AND** idempotency keys remain recipient-scoped

#### Scenario: no eligible recipients
- **WHEN** an owner lifecycle event is enqueued and no eligible recipients are enabled
- **THEN** no delivery jobs are created
- **AND** muted-path return contract is preserved

### Requirement: Routing preference services SHALL enforce eligibility rules
Reservation notification preference APIs SHALL only allow enablement for users eligible to receive reservation notifications.

#### Scenario: ineligible member attempts enablement
- **WHEN** a member without required receive permission updates reservation notification preference
- **THEN** request is denied with permission semantics

### Requirement: Owner routing settings UI SHALL reflect routing state and errors
Owner settings routing UI SHALL display deterministic behavior for loading, muted, permission-hint, and save-error states.

#### Scenario: permission hint for non-eligible user
- **WHEN** routing state indicates user cannot receive notifications
- **THEN** toggle is disabled
- **AND** permission hint is visible

#### Scenario: mutation failure while toggling preference
- **WHEN** preference update fails
- **THEN** error feedback is shown
- **AND** local state does not falsely report success
