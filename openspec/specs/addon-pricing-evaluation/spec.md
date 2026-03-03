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

## Domain Use Cases

The following scenarios ground the abstract pricing rules above in common venue operations. Each scenario maps a real-world add-on to its pricing type, mode, and expected engine behavior.

### Equipment Rental

#### Scenario: Racket rental — OPTIONAL FLAT with quantity
A venue offers badminton rackets for rent at ₱50 each per booking. A player books Court 1 for two hours and selects 3 rackets.
- **GIVEN** a SPECIFIC OPTIONAL FLAT add-on "Racket Rental" with `flat_fee_cents: 5000`
- **WHEN** the player selects the add-on with `quantity: 3`
- **THEN** the add-on contribution is `5000 × 3 = ₱150`, charged once regardless of booking duration

#### Scenario: Ball rental — OPTIONAL HOURLY with quantity
A venue rents basketballs at ₱30 per hour each. A player books two hours and selects 2 balls.
- **GIVEN** a SPECIFIC OPTIONAL HOURLY add-on "Ball Rental" with `hourly_rate_cents: 3000` and rules covering the booked window
- **WHEN** the player selects the add-on with `quantity: 2`
- **THEN** each covered segment contributes `3000 × 2 = ₱60`, totaling `₱60 × 2 hours = ₱120`

#### Scenario: Shoe rental — OPTIONAL FLAT, quantity defaults to 1
A venue offers shoe rental at ₱75 per booking. A player selects the add-on without specifying a quantity.
- **GIVEN** a SPECIFIC OPTIONAL FLAT add-on "Shoe Rental" with `flat_fee_cents: 7500`
- **WHEN** the player selects the add-on without a `quantity` field
- **THEN** quantity defaults to 1, and the add-on contribution is `₱75` charged once

### Court Lighting

#### Scenario: Night lighting — AUTO HOURLY with rule windows
A venue charges a ₱100/hr lighting surcharge for evening play. The rule window covers 6 PM–10 PM daily. A player books 5 PM–8 PM (three hours).
- **GIVEN** a SPECIFIC AUTO HOURLY add-on "Court Lighting" with `hourly_rate_cents: 10000` and rules from minute 1080 to 1320 (6 PM–10 PM)
- **WHEN** the booking spans 5 PM–8 PM (segments: 5 PM, 6 PM, 7 PM)
- **THEN** the 5 PM segment has no matching window and contributes `+0`; the 6 PM and 7 PM segments each contribute `₱100`, totaling `₱200`

#### Scenario: Daytime booking avoids lighting surcharge
A player books 9 AM–11 AM on a court with an AUTO lighting add-on configured for 6 PM–10 PM.
- **GIVEN** the same AUTO HOURLY "Court Lighting" add-on with evening-only rules
- **WHEN** no booking segments overlap the lighting window
- **THEN** all segments contribute `+0` for the lighting add-on and the booking total is unaffected

### Venue-Wide Facility Surcharges

#### Scenario: Air conditioning — GLOBAL AUTO HOURLY
A venue charges ₱50/hr for air conditioning across all courts during peak afternoon hours (12 PM–5 PM). A player books Court 2 from 3 PM–6 PM.
- **GIVEN** a GLOBAL AUTO HOURLY add-on "Air Conditioning" with `hourly_rate_cents: 5000` and rules from minute 720 to 1020 (12 PM–5 PM)
- **WHEN** the booking spans 3 PM–6 PM (segments: 3 PM, 4 PM, 5 PM)
- **THEN** the 3 PM and 4 PM segments match the window and contribute `₱50` each; the 5 PM segment falls outside and contributes `+0`; total AC surcharge is `₱100`

#### Scenario: Venue service fee — GLOBAL AUTO FLAT
A venue applies a flat ₱25 service fee to every booking regardless of court or duration.
- **GIVEN** a GLOBAL AUTO FLAT add-on "Service Fee" with `flat_fee_cents: 2500` and no rule windows
- **WHEN** any booking is priced at the venue
- **THEN** `₱25` is added to the booking total exactly once, unconditionally

### Towel and Locker Service

#### Scenario: Towel service — OPTIONAL FLAT, quantity per person
A venue offers towel service at ₱20 per towel per booking. A group booking selects 4 towels.
- **GIVEN** a SPECIFIC OPTIONAL FLAT add-on "Towel Service" with `flat_fee_cents: 2000`
- **WHEN** the player selects the add-on with `quantity: 4`
- **THEN** the add-on contribution is `2000 × 4 = ₱80`, charged once

### Coaching and Instruction

#### Scenario: Coaching session — OPTIONAL HOURLY
A venue offers optional coaching at ₱300/hr. A player books a two-hour slot and selects a coach.
- **GIVEN** a SPECIFIC OPTIONAL HOURLY add-on "Coaching Session" with `hourly_rate_cents: 30000` and rules covering the booked window
- **WHEN** the player selects the add-on with `quantity: 1`
- **THEN** each covered segment contributes `₱300`, totaling `₱600` for two hours

#### Scenario: Multiple coaches — OPTIONAL HOURLY with quantity
Same venue, but a group selects 2 coaches for a two-hour session.
- **GIVEN** the same OPTIONAL HOURLY "Coaching Session" add-on
- **WHEN** the player selects the add-on with `quantity: 2`
- **THEN** each covered segment contributes `30000 × 2 = ₱600`, totaling `₱1,200` for two hours

### Combined Add-Ons in a Single Booking

#### Scenario: Equipment, lighting, and venue fee in one booking
A player books Court 3 from 5 PM–8 PM. The court has a lighting surcharge (AUTO HOURLY, 6 PM–10 PM, ₱100/hr). The venue has a service fee (GLOBAL AUTO FLAT, ₱25). The player also rents 2 rackets (OPTIONAL FLAT, ₱50 each).
- **GIVEN** three active add-ons as described
- **WHEN** the booking is priced
- **THEN** the total add-on contribution is:
  - Lighting: 5 PM = `+0`, 6 PM = `₱100`, 7 PM = `₱100` → `₱200`
  - Service fee: `₱25` (once, unconditionally)
  - Racket rental: `₱50 × 2` = `₱100` (once, flat)
  - **Total add-ons: ₱325**
