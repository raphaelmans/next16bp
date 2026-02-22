## ADDED Requirements

### Requirement: Player booking flow supports multi-court cart submission
The discovery-to-booking flow SHALL allow users to proceed with multiple selected reservation items and submit them through a grouped booking checkout.

#### Scenario: Multiple items in booking checkout
- **WHEN** a player reaches booking checkout with two or more selected items
- **THEN** the checkout submits grouped reservation creation with item-level court/time data

#### Scenario: Different-time item summary
- **WHEN** selected items have different time ranges
- **THEN** the checkout renders itemized schedule and pricing summary before confirmation

### Requirement: Booking flow remains backward compatible for single selection
The system SHALL keep single-selection booking behavior functional for existing users and deep links.

#### Scenario: Single item route params
- **WHEN** a booking URL contains one selected slot in the legacy format
- **THEN** checkout continues using compatible single-item booking behavior
