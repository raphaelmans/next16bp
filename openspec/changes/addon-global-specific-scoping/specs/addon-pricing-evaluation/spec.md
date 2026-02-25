## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Pricing engine SHALL process GLOBAL and SPECIFIC add-ons in a single pass
The `computeSchedulePriceDetailed` function SHALL accept an optional `venueAddons` parameter (type `ScheduleAddon[]`) alongside the existing `addons` (court add-ons). GLOBAL add-ons SHALL be processed identically to SPECIFIC add-ons — same FLAT unconditional logic, same HOURLY window-matching logic. GLOBAL add-ons are always included (subject to `isActive`); they do not require player selection to be evaluated.

#### Scenario: Booking with both GLOBAL and SPECIFIC add-ons
- **WHEN** a booking is priced with one GLOBAL FLAT add-on (₱150) and one SPECIFIC HOURLY add-on (₱100/hr) across two hours
- **THEN** the total add-on contribution is ₱150 + ₱200 = ₱350

#### Scenario: Caller omits venueAddons parameter
- **WHEN** a caller does not pass `venueAddons` to `computeSchedulePriceDetailed`
- **THEN** pricing proceeds with only court add-ons, identical to pre-change behavior
