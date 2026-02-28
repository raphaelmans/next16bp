## Why

Team access and RBAC rules are core to safe reservation operations, but client-side permission gating behavior and some role/permission interaction surfaces remain under-tested. We need focused tests to prevent unauthorized access regressions and permission drift.

## What Changes

- Expand service/router RBAC coverage around organization member permissions:
  - permission checks and denials
  - owner implicit permission behavior
  - reservation notification receive eligibility gate behavior
- Add explicit tests for owner client RBAC helpers:
  - `canAccessPage`
  - `filterVisibleNavItems`
  - role display mapping behavior
- Add integration-with-mocks tests for owner permission context usage on key access-gated flows (team and reservation surfaces).

## Capabilities

### New Capabilities
- `team-access-rbac-testing`: Defines required behavioral coverage for team permission enforcement and owner-side RBAC access-gating logic.

### Modified Capabilities
- None.

## Impact

- Affected server modules:
  - `src/lib/modules/organization-member/services/organization-member.service.ts`
  - `src/lib/modules/organization-member/organization-member.router.ts`
- Affected client modules:
  - `src/features/owner/helpers.ts`
- Affected tests (new/expanded):
  - `src/__tests__/lib/modules/organization-member/services/organization-member.service.test.ts`
  - `src/__tests__/lib/modules/organization-member/organization-member.router.test.ts`
  - `src/__tests__/features/owner/helpers.test.ts`
- No API or database schema changes.
