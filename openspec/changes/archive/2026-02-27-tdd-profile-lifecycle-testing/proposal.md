## Why

Player profile state is a critical dependency for booking and payment flows, yet dedicated tests for profile service/router behavior are currently sparse. We need regression coverage for create/update/read/avatar paths and error mapping before further feature work builds on profile assumptions.

## What Changes

- Add TDD-driven service tests for profile lifecycle behavior in `ProfileService`:
  - `getOrCreateProfile` idempotent behavior
  - `updateProfile` auto-create path and field updates
  - `getProfile` and `getProfileById` not-found semantics
  - `uploadAvatar` storage + repository update contract
- Add router-level tests for `profileRouter`:
  - `me`, `update`, `uploadAvatar`, `getById`
  - domain error to TRPC error mapping for not-found and validation paths
- Add reservation-router integration-with-mocks regression for profile bootstrap assumptions where applicable.
- Keep all tests deterministic and offline using boundary doubles for storage and persistence.

## Capabilities

### New Capabilities
- `profile-lifecycle-testing`: Defines required behavioral test coverage for profile service/router lifecycle operations and contract-level error mapping.

### Modified Capabilities
- None.

## Impact

- Affected server modules:
  - `src/lib/modules/profile/services/profile.service.ts`
  - `src/lib/modules/profile/profile.router.ts`
  - `src/lib/modules/reservation/reservation.router.ts` (profile bootstrap regression assertions)
- Affected tests (new/expanded under mirrored layout):
  - `src/__tests__/lib/modules/profile/services/profile.service.test.ts`
  - `src/__tests__/lib/modules/profile/profile.router.test.ts`
  - targeted reservation-router regression additions.
- No API or database schema changes.
