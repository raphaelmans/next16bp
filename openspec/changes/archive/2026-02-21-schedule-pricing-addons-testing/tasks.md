## 1. Test harness and command wiring

- [x] 1.1 Add or standardize the unit-test runner/configuration needed for TypeScript unit tests in this repo.
- [x] 1.2 Add a documented `pnpm` script that executes schedule-pricing-addons unit tests deterministically in local and CI environments.

## 2. Shared pricing unit coverage

- [x] 2.1 Add deterministic golden/minimal/invalid fixture builders for schedule add-on pricing scenarios.
- [x] 2.2 Add unit tests for `computeSchedulePriceDetailed` covering OPTIONAL unselected exclusion, AUTO uncovered `+0` behavior with warning, HOURLY accumulation, and FLAT one-time charging.
- [x] 2.3 Add a regression test that asserts currency mismatch returns `ADDON_CURRENCY_MISMATCH`.

## 3. Service-layer unit coverage

- [x] 3.1 Add isolated unit tests for `court-addon` service validation using interface-based repository/transaction doubles.
- [x] 3.2 Add service tests for type-specific required fields, rule overlap rejection, and currency compatibility validation paths.
- [x] 3.3 Add service tests that verify transaction participation decisions (`ctx.tx` path vs owned transaction path) where applicable.

## 4. Structure, quality, and verification

- [x] 4.1 Place all new test files under mirrored `src/__tests__/` paths and enforce naming conventions from testing guides.
- [x] 4.2 Run lint and the new unit-test command, then resolve failures until both checks pass.
- [x] 4.3 Keep contract scenario parity by confirming unit scenarios align with existing add-on pricing contract cases.
