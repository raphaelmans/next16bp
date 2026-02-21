## 1. Schema and data migration

- [x] 1.1 Add schema changes for `court_addon` (`pricing_type`, `flat_fee_cents`, `flat_fee_currency`) with safe defaults/backfill support.
- [x] 1.2 Update `court_addon_rate_rule` constraints for HOURLY fields and preserve day/minute window integrity constraints.
- [x] 1.3 Implement migration/backfill logic to classify existing add-ons into `HOURLY` or `FLAT` and populate required fields.

## 2. Domain validation and invariants

- [x] 2.1 Implement service-layer validation for type-specific required fields (HOURLY vs FLAT).
- [x] 2.2 Enforce non-overlapping add-on rule windows per add-on/day using the same pattern as base rate rule overlap checks.
- [x] 2.3 Enforce add-on currency compatibility with base booking currency at write-time and evaluation-time.

## 3. Pricing engine behavior

- [x] 3.1 Update segment evaluation flow to apply HOURLY add-ons only on matching rule windows.
- [x] 3.2 Implement FLAT add-on first-overlap trigger so each FLAT add-on is charged once per booking.
- [x] 3.3 Ensure AUTO uncovered segments contribute `+0` and never reject bookings in this phase.

## 4. Warnings and observability

- [x] 4.1 Add owner/admin warning emission for partial AUTO coverage without converting warnings into hard errors.
- [x] 4.2 Add structured logging or diagnostics payloads for add-on rule coverage and mismatch conditions.
- [x] 4.3 Reserve extension points for future `AUTO_STRICT` behavior without enabling it now.

## 5. Verification and parity

- [x] 5.1 Add/extend tests for rule geometry validation, overlap rejection, and currency mismatch behavior.
- [x] 5.2 Add/extend pricing tests for OPTIONAL selection, AUTO partial coverage (`+0`), HOURLY accumulation, and FLAT one-time charging.
- [x] 5.3 Execute parity checks against documented scenarios in `docs/schedule-pricing-addons-state-machine.md` and `docs/schedule-pricing-addons-erd.md`.

## 6. Rollout and safety

- [x] 6.1 Sequence deployment as additive migration first, then service/evaluation logic rollout.
- [x] 6.2 Add rollback guardrails to disable v2 add-on evaluation path if regressions are detected.
- [x] 6.3 Validate migrated data and warning telemetry post-deploy before deprecating legacy assumptions.
