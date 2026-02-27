## Context

The reservation-notification routing work now spans owner UI and server modules:
owner settings/dashboard render conditional messaging, organization-member
services compute routing eligibility, and notification-delivery services fan out
jobs per opted-in recipient. Current behavior is working but branch-heavy logic
is still embedded in component/service code and test coverage is not yet
thorough across muted/fan-out paths.

The change must align with:
- `guides/client/core/domain-logic.md`
- `guides/client/core/testing.md`
- `guides/server/core/testing-service-layer.md`

## Goals / Non-Goals

**Goals:**
- Extract deterministic owner notification-routing UI decisions into pure feature
  domain functions.
- Extract recipient/routing summary derivation into shared module pure domain
  functions.
- Add table-driven unit coverage for new pure functions in mirrored
  `src/__tests__/` paths.
- Expand service-layer tests to cover multi-recipient fan-out and muted
  no-recipient behavior for owner notification flows.
- Keep production behavior unchanged while improving confidence and
  maintainability.

**Non-Goals:**
- Changing notification channels, event contracts, or recipient eligibility
  policy.
- Refactoring unrelated owner dashboard/settings logic outside routing concerns.
- Introducing integration/e2e infrastructure for this change.

## Decisions

### D1: Add feature-local pure domain helpers for owner routing UI

Create `src/features/owner/domain.ts` for notification-routing state derivation
used by owner settings and dashboard pages.

Rationale:
- Keeps UI rendering components focused on presentation.
- Enables deterministic table-driven tests without React runtime/mocks.

Alternative considered:
- Keep branches inline in components: rejected because this duplicates logic and
  is harder to test deterministically.

### D2: Add shared pure recipient/routing derivation helpers in organization-member module

Create `src/lib/modules/organization-member/shared/domain.ts` with pure
functions to compute:
- enabled recipient intersection (`eligible ∩ optedIn`)
- routing status summary shape (`count`, `hasEnabledRecipients`)

Rationale:
- Keeps domain rules reusable between service methods and future consumers.
- Reduces service branching and improves isolated unit coverage.

Alternative considered:
- Keep logic in service methods only: rejected due weaker reuse/testability.

### D3: Strengthen service-layer tests at public service boundaries

Expand tests for:
- `OrganizationMemberService` notification preference/routing methods
- `NotificationDeliveryService` owner lifecycle fan-out and muted behavior

Rationale:
- Matches server testing guide: behavior through public interfaces, deterministic
  doubles, no private method tests.

Alternative considered:
- Broader controller/router tests only: rejected because service-level branch
  coverage would remain incomplete.

## Risks / Trade-offs

- [Over-specifying implementation details in tests] -> Mitigation: assert
  behavior and outputs, not private internals.
- [Logic extraction introduces accidental behavior drift] -> Mitigation: add
  regression tests before/while refactor and keep function contracts explicit.
- [Duplicated tests between shared and service layers] -> Mitigation: shared
  invariant tests live once in shared domain tests; service tests focus on
  orchestration and branch behavior.

## Migration Plan

1. Add new pure domain helper files (feature-local + shared module).
2. Update consumer code paths to call helpers without changing output semantics.
3. Add mirrored `src/__tests__/` unit tests for pure helpers.
4. Expand service-layer tests for fan-out and muted branches.
5. Run targeted lint + unit suites and adjust if regressions appear.

Rollback strategy:
- Revert helper adoption and retain existing inline logic; test files can remain
  as non-invasive safety net if desired.

## Open Questions

- Should owner routing view-state helpers eventually move to a dedicated
  `owner/shared` slice if reused across more owner surfaces?
- Should notification-delivery service tests add explicit log-assertion coverage
  for muted routing diagnostics, or keep assertions strictly on behavior/output?
