## ADDED Requirements

### Requirement: Reservation awaiting-owner-confirmation acceptance is validated by e2e contract
Reservation behavior for player-created bookings SHALL be covered by an e2e acceptance contract that verifies post-submit awaiting-owner-confirmation signals in UI.

#### Scenario: E2e validates CREATED-state booking confirmation
- **WHEN** a player completes a single-slot booking through the public venue booking flow
- **THEN** the acceptance test verifies reservation detail renders CREATED-state signals required for owner confirmation workflow
