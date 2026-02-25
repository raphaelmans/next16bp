## Purpose

Defines validation rules and warning behavior for add-on pricing, including currency compatibility, partial AUTO coverage warnings, and the distinction between soft warnings and hard errors.

## Requirements

### Requirement: Currency compatibility validation
The system SHALL require add-on currency to match the booking base pricing currency for both HOURLY and FLAT add-ons.

#### Scenario: Reject currency mismatch
- **WHEN** an add-on currency differs from the booking base currency
- **THEN** pricing fails with a currency mismatch error

### Requirement: Owner warning for partial AUTO coverage
The system SHALL generate an owner/admin warning when an AUTO add-on has booking segments not covered by any add-on rule.

#### Scenario: Partial coverage warning emitted
- **WHEN** an AUTO add-on has at least one uncovered segment during evaluation
- **THEN** pricing completes and a partial coverage warning is recorded

### Requirement: Validation separates warnings from hard errors
The system SHALL treat uncovered AUTO segments as warnings, while treating invalid rule geometry and overlap conflicts as hard validation errors.

#### Scenario: Uncovered AUTO with valid rules
- **WHEN** a booking includes uncovered AUTO segments but all configured rules are valid
- **THEN** the system returns pricing results with warnings and no hard validation error

### Requirement: Deferred AUTO_STRICT behavior
The system MUST NOT enforce reject-on-uncovered-segment behavior for AUTO add-ons in this change, reserving that behavior for a future AUTO_STRICT capability.

#### Scenario: AUTO does not reject uncovered segment
- **WHEN** an AUTO add-on has uncovered segments
- **THEN** the system does not reject the booking based on missing add-on coverage
