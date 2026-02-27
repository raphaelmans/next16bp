## ADDED Requirements

### Requirement: System SHALL support GLOBAL and SPECIFIC add-on scopes
The system SHALL support two add-on scopes: GLOBAL (venue-level, stored in `place_addon`) and SPECIFIC (court-level, stored in `court_addon`). GLOBAL add-ons are inherited by all courts at the place and cannot be overridden per-court. SPECIFIC add-ons apply only to their configured court.

#### Scenario: GLOBAL add-on applies to all courts
- **WHEN** a place has a GLOBAL add-on and a booking is made for any court at that place
- **THEN** the GLOBAL add-on is included in pricing alongside any SPECIFIC add-ons for that court

#### Scenario: SPECIFIC add-on does not affect sibling courts
- **WHEN** Court A has a SPECIFIC add-on and Court B does not
- **THEN** a booking on Court B excludes the Court A add-on entirely

## MODIFIED Requirements

### Requirement: Type-specific price fields
The system SHALL enforce type-specific pricing fields such that HOURLY add-ons MUST provide rate values in their respective rate rule table (`court_addon_rate_rule` for SPECIFIC, `place_addon_rate_rule` for GLOBAL), and FLAT add-ons MUST provide `flat_fee_cents` and `flat_fee_currency` on their add-on record. FLAT add-ons SHALL NOT be required to have any rate rule rows.

#### Scenario: Reject FLAT add-on missing fee
- **WHEN** a FLAT add-on is saved without `flat_fee_cents` or `flat_fee_currency`
- **THEN** the system rejects the write with a validation error

#### Scenario: FLAT add-on with no rule rows is valid
- **WHEN** a FLAT add-on is saved with an empty rules array
- **THEN** the system persists the add-on without error and it charges unconditionally per booking
