# Schedule Pricing v2 Alignment Review

Source reviewed: `/Users/raphaelm/Downloads/schedule-pricing-docs-v2.html`

Purpose: record whether repository pricing add-on docs align with v2 design, and what was updated.

---

## Alignment Summary

Overall alignment status: **aligned after updates**.

The markdown docs now reflect v2 decisions:
- Use `pricing_type = HOURLY | FLAT`.
- Keep one applicability table for add-ons (`court_addon_rate_rule`).
- Store flat fee amount on add-on (`flat_fee_cents`, `flat_fee_currency`).
- Keep `AUTO` semantics as apply-when-ruled (`+0` where no matching rule).
- Keep `AUTO_STRICT` as deferred, not active behavior.

---

## What Changed

The following docs were updated to match v2:

1. `docs/schedule-pricing-addons-erd.md`
- Replaced dual-table model (`rate_rule` + `fee_rule`) with single rule table + add-on-level flat fee.
- Replaced `PER_HOUR/PER_BOOKING` naming with `HOURLY/FLAT`.
- Added explicit `flat_fee_cents` and `flat_fee_currency` fields on `court_addon`.
- Kept `AUTO_STRICT` as deferred.

2. `docs/schedule-pricing-addons-state-machine.md`
- Reframed flow using `HOURLY/FLAT`.
- Updated transitions to one rule source for both applicability and hourly charging.
- Clarified selected semantics:
  - no matching rule on a segment -> `+0`
  - `AUTO` does not reject for missing coverage
  - `FLAT` charges once on first overlap

---

## v2 Semantics Captured

The following behavior is now documented as the canonical design:

- `HOURLY` add-ons:
  - Charge `hourly_rate_cents` only for covered 60-minute segments.
  - Scale with duration inside applicable windows.

- `FLAT` add-ons:
  - Charge `flat_fee_cents` exactly once if any segment overlaps an applicability window.
  - Do not scale with duration.

- `AUTO` mode:
  - Apply when a rule matches.
  - If no rule matches a segment, contribution is `+0`.
  - Missing coverage should surface as owner/admin warning, not booking rejection.

- `AUTO_STRICT` mode:
  - Deferred for future use.

---

## Follow-up Notes

- If this v2 model is accepted as final, the next implementation docs should include:
  - migration plan for new add-on columns/enum values
  - deterministic conflict rules for overlapping add-on rule windows
  - owner UI validation warnings for partial `AUTO` coverage vs court hours
