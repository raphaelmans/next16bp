## Why

Recent organization-member RBAC and reservation notification routing work added
cross-module logic in owner UI, service-layer authorization, and notification
fan-out delivery. We need stronger, guide-aligned test coverage and pure domain
logic extraction to reduce regression risk and keep behavior deterministic.

## What Changes

- Extract client notification-routing view-state derivation into pure
  `src/features/owner/domain.ts` functions.
- Extract shared server-side recipient/routing derivation helpers into
  `src/lib/modules/organization-member/shared/domain.ts` pure functions.
- Add table-driven unit tests for new domain functions in mirrored
  `src/__tests__/` locations.
- Expand service-layer tests for organization-member and notification-delivery
  flows to cover permission gates, fan-out behavior, muted routing, and
  idempotent outputs.
- Align test structure and style with
  `guides/client/core/domain-logic.md`,
  `guides/client/core/testing.md`, and
  `guides/server/core/testing-service-layer.md`.

## Capabilities

### New Capabilities
- `domain-logic-service-testing`: Define deterministic domain-function contracts
  and required service-layer regression coverage for reservation notification
  routing.

### Modified Capabilities
- None.

## Impact

- Frontend: owner dashboard/settings notification-routing state is derived by
  pure domain helpers and covered by unit tests.
- Server: organization-member shared routing derivation logic is centralized and
  unit tested; service tests gain broader branch coverage.
- Testing: adds new `__tests__` files and expands existing service tests for
  reservation notification routing fan-out/mute semantics.
