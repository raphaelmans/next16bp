## MODIFIED Requirements

### Requirement: Player booking flow supports multi-court cart submission
The discovery-to-booking flow SHALL allow users to proceed with multiple selected reservation items, submit them through grouped booking checkout, and continue into group-first post-checkout handling.

#### Scenario: Multiple items in booking checkout
- **WHEN** a player reaches booking checkout with two or more selected items
- **THEN** the checkout submits grouped reservation creation with item-level court/time data

#### Scenario: Different-time item summary
- **WHEN** selected items have different time ranges
- **THEN** the checkout renders itemized schedule and pricing summary before confirmation

#### Scenario: Grouped checkout routes to grouped post-checkout surface
- **WHEN** grouped booking creation succeeds
- **THEN** the player is routed to a reservation-group handling surface
- **AND** the next primary actions are presented at group level rather than as separate per-item booking flows
