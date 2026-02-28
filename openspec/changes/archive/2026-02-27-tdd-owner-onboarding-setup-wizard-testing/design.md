## Context

Owner onboarding status is computed through multi-repository orchestration and then consumed by wizard UI logic that controls step progression and completion guards. This path requires direct test coverage at use-case and client-domain levels.

Targeted modules:
- `src/lib/modules/owner-setup/use-cases/get-owner-setup-status.use-case.ts`
- `src/lib/modules/owner-setup/owner-setup.router.ts`
- `src/features/owner/components/get-started/wizard/wizard-helpers.ts`
- `src/features/owner/components/get-started/wizard/wizard-hooks.ts`

## Goals / Non-Goals

**Goals**
- Add orchestration tests for owner setup status derivation.
- Add router contract tests for setup status retrieval.
- Add wizard helper/hook tests for progression, skip, and completion guard behavior.

**Non-Goals**
- Redesign onboarding steps or UX.
- Replace existing owner get-started flow architecture.

## Decisions

### 1. Use-case tests own aggregation correctness
Tests verify how organization/place/court/payment data combine into final status and next-step output.

### 2. Wizard helper tests own flow logic
Step-order and completion guard behavior is validated through pure/helper and hook tests, not page-level rendering complexity.

### 3. Router coverage remains thin and contract-focused
Router tests only verify procedure-to-use-case integration and expected error/response contracts.

## Risks / Trade-offs

- Setup status depends on many repositories; test harnesses must stay readable to avoid brittle fixtures.
- Wizard auto-skip can be timing-sensitive; tests should isolate deterministic conditions.
