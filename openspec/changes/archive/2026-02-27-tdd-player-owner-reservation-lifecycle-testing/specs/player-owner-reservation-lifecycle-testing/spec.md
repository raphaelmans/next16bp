## ADDED Requirements

### Requirement: Reservation lifecycle transitions SHALL enforce valid state progression
Player and owner lifecycle operations SHALL only allow transitions defined by reservation status rules.

#### Scenario: owner confirms payment from invalid status
- **WHEN** owner confirmation is requested for a reservation not in a payment-marked state
- **THEN** operation fails with an invalid-status error
- **AND** reservation state remains unchanged

#### Scenario: owner accepts reservation group with mixed invalid states
- **WHEN** a group contains at least one reservation that cannot be accepted
- **THEN** group acceptance fails with no partial transition

### Requirement: Single and group lifecycle paths SHALL maintain parity for equivalent actions
Equivalent owner/player actions across single and grouped reservations SHALL produce semantically consistent outcomes.

#### Scenario: rejection parity
- **WHEN** owner rejects a single reservation and a comparable reservation group
- **THEN** resulting statuses and side-effect intents are consistent for corresponding items

### Requirement: Owner reservation router SHALL preserve stable action contracts
Owner reservation router procedures SHALL continue to delegate correctly and map domain errors to expected transport codes.

#### Scenario: owner action conflict mapping
- **WHEN** owner action fails due to overlap/conflict domain errors
- **THEN** router returns TRPC `CONFLICT`
