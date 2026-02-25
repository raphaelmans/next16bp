## Purpose

Defines the data model constraints for court add-ons, including pricing type and mode enumerations, type-specific required fields, and rule window validity and overlap rules.

## Requirements

### Requirement: Add-on pricing type and mode model
The system SHALL store each add-on with `pricing_type` and `mode` where `pricing_type` MUST be `HOURLY` or `FLAT`, and `mode` MUST be `OPTIONAL` or `AUTO`.

#### Scenario: Persisting a valid add-on
- **WHEN** an add-on is created with `pricing_type=HOURLY` and `mode=AUTO`
- **THEN** the add-on is persisted with those exact enum values

### Requirement: System SHALL support GLOBAL and SPECIFIC add-on scopes
The system SHALL support two add-on scopes: GLOBAL (venue-level, stored in `place_addon`) and SPECIFIC (court-level, stored in `court_addon`). GLOBAL add-ons are inherited by all courts at the place and cannot be overridden per-court. SPECIFIC add-ons apply only to their configured court.

#### Scenario: GLOBAL add-on applies to all courts
- **WHEN** a place has a GLOBAL add-on and a booking is made for any court at that place
- **THEN** the GLOBAL add-on is included in pricing alongside any SPECIFIC add-ons for that court

#### Scenario: SPECIFIC add-on does not affect sibling courts
- **WHEN** Court A has a SPECIFIC add-on and Court B does not
- **THEN** a booking on Court B excludes the Court A add-on entirely

### Requirement: Type-specific price fields
The system SHALL enforce type-specific pricing fields such that HOURLY add-ons MUST provide rate values in their respective rate rule table (`court_addon_rate_rule` for SPECIFIC, `place_addon_rate_rule` for GLOBAL), and FLAT add-ons MUST provide `flat_fee_cents` and `flat_fee_currency` on their add-on record. FLAT add-ons SHALL NOT be required to have any rate rule rows.

#### Scenario: Reject FLAT add-on missing fee
- **WHEN** a FLAT add-on is saved without `flat_fee_cents` or `flat_fee_currency`
- **THEN** the system rejects the write with a validation error

#### Scenario: FLAT add-on with no rule rows is valid
- **WHEN** a FLAT add-on is saved with an empty rules array
- **THEN** the system persists the add-on without error and it charges unconditionally per booking

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

### Requirement: OPTIONAL add-on selection carries a quantity field
When a player selects an OPTIONAL add-on, the selection SHOULD carry an integer `quantity` ≥ 1. If `quantity` is omitted or invalid (< 1), the system SHALL default it to 1. AUTO add-ons always apply at quantity 1 and are not player-adjustable.

#### Scenario: OPTIONAL selection with explicit quantity
- **WHEN** a player selects an OPTIONAL add-on with `quantity: 2`
- **THEN** the selection is stored as `{ addonId, quantity: 2 }` and pricing is multiplied accordingly

#### Scenario: OPTIONAL selection with omitted quantity
- **WHEN** a player selects an OPTIONAL add-on without specifying quantity
- **THEN** the system treats it as `quantity: 1` and pricing is identical to legacy binary selection
