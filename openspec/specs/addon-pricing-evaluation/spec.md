## Purpose

Defines how the pricing engine evaluates OPTIONAL and AUTO add-ons against booking segments, including segment coverage, HOURLY accumulation, and FLAT one-time charging semantics.

## Requirements

### Requirement: Optional add-ons apply only when selected
The pricing engine SHALL apply an OPTIONAL add-on only when that add-on is explicitly selected for the booking.

#### Scenario: Unselected OPTIONAL add-on
- **WHEN** an OPTIONAL add-on is configured but not selected
- **THEN** the booking total excludes that add-on contribution

### Requirement: AUTO add-ons apply when rule windows match
The pricing engine SHALL evaluate AUTO add-ons against add-on rule windows per booking segment and apply pricing only where a matching window exists.

#### Scenario: Partial AUTO window coverage
- **WHEN** some segments match AUTO add-on windows and others do not
- **THEN** only matching segments contribute add-on price

### Requirement: Uncovered segments contribute zero in AUTO mode
For AUTO add-ons, segments without a matching add-on rule SHALL contribute `+0` and MUST NOT cause booking rejection.

#### Scenario: AUTO uncovered segment
- **WHEN** a segment has no matching add-on rule for an AUTO add-on
- **THEN** the segment contributes `+0` for that add-on and pricing continues

### Requirement: HOURLY add-ons scale by covered segments
HOURLY add-ons SHALL charge `hourly_rate_cents` only for covered 60-minute segments and SHALL scale linearly with the number of covered segments.

#### Scenario: Two covered hourly segments
- **WHEN** a HOURLY add-on with rate 500 cents covers two 60-minute segments
- **THEN** the add-on contribution is 1000 cents

### Requirement: FLAT add-ons charge once on first overlap
FLAT add-ons SHALL be charged exactly once per add-on when any booking segment first overlaps an add-on rule window.

#### Scenario: Multiple overlaps with FLAT add-on
- **WHEN** three booking segments overlap FLAT add-on windows
- **THEN** the flat fee is added one time only
