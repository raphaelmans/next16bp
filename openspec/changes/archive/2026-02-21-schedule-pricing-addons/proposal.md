## Why

The current schedule-pricing flow only supports base hourly pricing and cannot express add-ons with both hourly and one-time flat fee behavior. We need a v2-aligned add-on model now so pricing logic, schema contracts, and future implementation can converge on one consistent design from `docs/schedule-pricing-*`.

## What Changes

- Add a v2 add-on pricing model with `pricing_type = HOURLY | FLAT` and `mode = OPTIONAL | AUTO` (`AUTO_STRICT` remains deferred).
- Standardize add-on applicability to a single rule table (`court_addon_rate_rule`) for both HOURLY charging windows and FLAT availability windows.
- Define canonical pricing semantics: `AUTO` applies where rules match, uncovered segments contribute `+0`, and `FLAT` charges exactly once on first overlap.
- Specify data constraints and invariants for day/time windows, currency consistency, non-overlap validation, and pricing field requirements by add-on type.
- Establish migration-facing expectations for schema updates and downstream service/UI validation behavior.

## Capabilities

### New Capabilities
- `addon-pricing-data-model`: Define v2 add-on schema contracts, enums, constraints, and invariants for `court_addon` and `court_addon_rate_rule`.
- `addon-pricing-evaluation`: Define deterministic runtime behavior for HOURLY and FLAT add-on pricing across booking segments, including `OPTIONAL` and `AUTO` mode semantics.
- `addon-pricing-validation-and-warnings`: Define validation and warning rules for currency compatibility, rule-window coverage behavior, and owner/admin-facing coverage diagnostics.

### Modified Capabilities
- None.

## Impact

- Affects schedule-pricing domain contracts and upcoming implementation in pricing/availability services.
- Introduces/changes DB schema expectations for add-ons and add-on rate rules.
- Shapes follow-up API/service behavior for add-on calculation and validation.
- Aligns the codebase with v2 reference behavior documented in:
  - `docs/schedule-pricing-addons-erd.md`
  - `docs/schedule-pricing-addons-state-machine.md`
  - `docs/schedule-pricing-addons-v2-alignment-review.md`
