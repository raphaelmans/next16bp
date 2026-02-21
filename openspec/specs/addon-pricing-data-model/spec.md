## Purpose

Defines the data model constraints for court add-ons, including pricing type and mode enumerations, type-specific required fields, and rule window validity and overlap rules.

## Requirements

### Requirement: Add-on pricing type and mode model
The system SHALL store each add-on with `pricing_type` and `mode` where `pricing_type` MUST be `HOURLY` or `FLAT`, and `mode` MUST be `OPTIONAL` or `AUTO`.

#### Scenario: Persisting a valid add-on
- **WHEN** an add-on is created with `pricing_type=HOURLY` and `mode=AUTO`
- **THEN** the add-on is persisted with those exact enum values

### Requirement: Type-specific price fields
The system SHALL enforce type-specific pricing fields such that HOURLY add-ons MUST provide rate values in `court_addon_rate_rule`, and FLAT add-ons MUST provide `flat_fee_cents` and `flat_fee_currency` on `court_addon`.

#### Scenario: Reject FLAT add-on missing fee
- **WHEN** a FLAT add-on is saved without `flat_fee_cents` or `flat_fee_currency`
- **THEN** the system rejects the write with a validation error

### Requirement: Add-on rule window integrity
The system SHALL validate add-on rule windows with `day_of_week` in `0..6`, `start_minute` in `0..1439`, `end_minute` in `1..1440`, and `start_minute < end_minute`.

#### Scenario: Reject invalid minute range
- **WHEN** a rule is submitted with `start_minute >= end_minute`
- **THEN** the system rejects the rule as invalid

### Requirement: No overlapping rules per add-on day
The system SHALL prevent overlapping windows for the same add-on on the same day.

#### Scenario: Reject overlapping windows
- **WHEN** a second rule overlaps an existing window for the same add-on and day
- **THEN** the system rejects the second rule with an overlap error
