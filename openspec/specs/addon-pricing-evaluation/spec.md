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

### Requirement: FLAT add-ons charge once per booking unconditionally
FLAT add-ons SHALL be charged exactly once per booking unconditionally, without requiring any booking segment to overlap an add-on rule window. The `flat_fee_cents × quantity` amount SHALL be added to the booking total before the hourly segment loop executes. FLAT add-ons with no rule rows SHALL still be charged correctly.

#### Scenario: FLAT add-on with no rule windows charges correctly
- **WHEN** a FLAT add-on has zero rate rule rows and a player selects it (or it is AUTO mode)
- **THEN** `flat_fee_cents × quantity` is added to the booking total exactly once

#### Scenario: Multiple overlaps with FLAT add-on still charges once
- **WHEN** three booking segments would overlap FLAT add-on windows (if any were configured)
- **THEN** the flat fee is added one time only, regardless of segment count

#### Scenario: AUTO FLAT add-on charges unconditionally
- **WHEN** an AUTO FLAT add-on is active for a booking
- **THEN** `flat_fee_cents × 1` is always added to the booking total without any window evaluation

### Requirement: Pricing engine SHALL process GLOBAL and SPECIFIC add-ons in a single pass
The `computeSchedulePriceDetailed` function SHALL accept an optional `venueAddons` parameter (type `ScheduleAddon[]`) alongside the existing `addons` (court add-ons). GLOBAL add-ons SHALL be processed identically to SPECIFIC add-ons: same FLAT unconditional logic and same HOURLY window-matching logic. GLOBAL add-ons are always included (subject to `isActive`); they do not require player selection to be evaluated.

#### Scenario: Booking with both GLOBAL and SPECIFIC add-ons
- **WHEN** a booking is priced with one GLOBAL FLAT add-on (₱150) and one SPECIFIC HOURLY add-on (₱100/hr) across two hours
- **THEN** the total add-on contribution is ₱150 + ₱200 = ₱350

#### Scenario: Caller omits venueAddons parameter
- **WHEN** a caller does not pass `venueAddons` to `computeSchedulePriceDetailed`
- **THEN** pricing proceeds with only court add-ons, identical to pre-change behavior

### Requirement: OPTIONAL add-on pricing scales by player-selected quantity
The pricing engine SHALL multiply an OPTIONAL add-on's contribution by its player-selected `quantity`. AUTO add-ons ignore quantity and always apply at quantity 1.

#### Scenario: HOURLY OPTIONAL with quantity N
- **WHEN** an OPTIONAL HOURLY add-on is selected with `quantity: N`
- **THEN** each covered 60-minute segment contributes `hourly_rate_cents × N` (not `hourly_rate_cents × 1`)

#### Scenario: FLAT OPTIONAL with quantity N
- **WHEN** an OPTIONAL FLAT add-on is selected with `quantity: N`
- **THEN** the total flat contribution is `flat_fee_cents × N`, still charged only once per add-on (not per segment)

#### Scenario: AUTO add-on ignores quantity
- **WHEN** an AUTO add-on is evaluated regardless of any quantity field
- **THEN** it always contributes as if `quantity: 1`
