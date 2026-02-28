## Why

Owner onboarding directly determines whether venues can accept reservations, but orchestration and wizard-navigation logic are not comprehensively tested. We need coverage for setup-status derivation and wizard gating to prevent onboarding regressions.

## What Changes

- Add use-case level tests for owner setup orchestration in `GetOwnerSetupStatusUseCase`:
  - organization/claim/place/court/payment aggregation
  - primary place selection
  - readiness and next-step derivation
  - setup completion conditions
- Add router-level tests for `ownerSetupRouter.getStatus` behavior and call contract.
- Add targeted client-domain/wizard tests for setup flow correctness:
  - first incomplete step derivation
  - completion guard behavior
  - step navigation helpers
  - auto-skip behavior from default step
- Keep tests deterministic with mocked repositories and hook boundaries.

## Capabilities

### New Capabilities
- `owner-onboarding-setup-wizard-testing`: Defines required coverage for owner setup status orchestration and wizard-step behavioral contracts.

### Modified Capabilities
- None.

## Impact

- Affected server modules:
  - `src/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case.ts`
  - `src/lib/modules/owner-setup/owner-setup.router.ts`
- Affected client modules:
  - `src/features/owner/components/get-started/wizard/wizard-helpers.ts`
  - `src/features/owner/components/get-started/wizard/wizard-hooks.ts`
- Affected tests (new/expanded):
  - `src/__tests__/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case.test.ts`
  - `src/__tests__/lib/modules/owner-setup/owner-setup.router.test.ts`
  - `src/__tests__/features/owner/components/get-started/wizard/wizard-helpers.test.ts`
  - `src/__tests__/features/owner/components/get-started/wizard/wizard-hooks.test.ts`
- No API or database schema changes.
