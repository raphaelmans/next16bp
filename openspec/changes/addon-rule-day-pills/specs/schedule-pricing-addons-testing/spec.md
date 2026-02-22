## Purpose

Delta spec extending the existing `schedule-pricing-addons-testing` spec to cover previously unspecified pricing scenarios identified during the day-pills redesign, and to add unit test requirements for the new `collapseRulesToGroups` / `expandGroupsToRules` helpers following the `domain-logic.md` pure-function testing standard.

## ADDED Requirements

### Requirement: FLAT add-on with no rule windows SHALL contribute zero and not charge
The pricing engine SHALL treat a FLAT add-on that has zero configured rule windows as contributing `+0` to the booking total, consistent with the "charged on first overlap" rule (no windows = no overlap possible).

#### Scenario: FLAT add-on with no windows contributes zero
- **WHEN** a booking is priced with an AUTO FLAT add-on that has no rule windows
- **THEN** the add-on contributes `+0` and no flat fee appears in the total

#### Scenario: FLAT add-on with no windows does not block booking
- **WHEN** a booking is submitted with an AUTO FLAT add-on that has no rule windows
- **THEN** pricing succeeds (no hard error) and the booking total excludes the flat fee

### Requirement: Multiple AUTO add-ons SHALL charge independently per covered segment
When two or more AUTO add-ons are configured with overlapping time windows, the pricing engine SHALL evaluate and charge each add-on independently for each covered segment.

#### Scenario: Two AUTO HOURLY add-ons both covering a segment
- **WHEN** a booking segment is covered by two AUTO HOURLY add-ons at `₱200/hr` and `₱100/hr`
- **THEN** the segment contributes both `+₱200` and `+₱100`, for a combined add-on total of `₱300` for that segment

#### Scenario: Multi-AUTO with same currency does not produce currency mismatch
- **WHEN** two AUTO add-ons both use the same currency as the base rate
- **THEN** pricing succeeds without a `ADDON_CURRENCY_MISMATCH` error

### Requirement: HOURLY add-on window wider than booking SHALL charge only covered segments
A HOURLY add-on whose rule window extends beyond the booking time range SHALL charge only for the booking segments that fall within the window, not for the full window duration.

#### Scenario: Add-on window 09:00–22:00, booking 10:00–12:00
- **WHEN** a HOURLY add-on covers `09:00–22:00` and the booking is `10:00–12:00` (2 segments)
- **THEN** the add-on charges for 2 segments only (`2 × hourlyRateCents`), not 13 segments

### Requirement: Collapse/expand helpers SHALL be covered by pure unit tests following domain-logic.md
The `collapseRulesToGroups` and `expandGroupsToRules` functions SHALL be tested as pure functions in `src/__tests__/features/court-addons/helpers.test.ts`, with no mocks, no network, and no framework runtime, using table-driven cases per the `domain-logic.md` testing standard.

#### Scenario: Round-trip fidelity — collapse then expand produces equivalent rows
- **WHEN** a set of `N` per-day `CourtAddonRuleForm` rows is passed through `collapseRulesToGroups` then `expandGroupsToRules`
- **THEN** the output set is equivalent to the input (same `dayOfWeek`, `startMinute`, `endMinute`, `hourlyRateCents`, `currency` values; order may differ)

#### Scenario: Table-driven cases cover HOURLY collapse, FLAT collapse, mixed rates, and single-day
- **WHEN** unit tests run for the collapse helper
- **THEN** cases assert: (a) 5 identical HOURLY weekday rows → 1 group with 5 days; (b) FLAT Sa/Su rows → 1 group with 2 days; (c) Mon `₱500` and Sat `₱800` same times → 2 groups; (d) single Mon row → 1 group with 1 day

#### Scenario: Empty day group is rejected before expand
- **WHEN** `expandGroupsToRules` receives a group with `days: []`
- **THEN** it returns zero rows for that group (safe no-op, UI validation is the primary guard)

### Requirement: Add-on pricing unit tests SHALL mirror source tree under src/__tests__/
All new add-on pricing and helper unit tests SHALL follow the mirrored path convention from `domain-logic.md`:
- `src/features/court-addons/helpers.ts` → `src/__tests__/features/court-addons/helpers.test.ts`

#### Scenario: Test file location is derivable from source path
- **WHEN** a developer adds a test for `collapseRulesToGroups` in `src/features/court-addons/helpers.ts`
- **THEN** the test file is placed at `src/__tests__/features/court-addons/helpers.test.ts` with no production source files alongside it
