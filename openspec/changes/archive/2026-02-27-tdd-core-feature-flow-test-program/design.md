## Context

This parent change defines the program contract for a multi-change testing initiative focused on core player and owner flows. The objective is to make child changes parallelizable while preserving a consistent test strategy and quality bar.

The repository already contains substantial reservation, organization-member, and notification tests, but coverage is uneven across profile lifecycle, onboarding orchestration, and cross-flow lifecycle transitions. This parent artifact does not introduce runtime logic; it standardizes the delivery model used by child test changes.

## Goals / Non-Goals

**Goals**
- Define one shared test strategy across all child changes.
- Define priority tiers and sequencing for core-flow test work.
- Define a common acceptance gate for all child changes.
- Preserve implementation independence so child changes can be executed in parallel.

**Non-Goals**
- Implement production code changes.
- Replace all existing tests or refactor unrelated suites.
- Introduce e2e/Playwright requirements in this program.

## Decisions

### 1. Testing mode is unit + integration-with-mocks only
All changes in this program use deterministic unit and service/router integration tests with mocked boundaries.

### 2. TDD is mandatory for new coverage slices
Each child uses red-green-refactor with behavior-first assertions through public interfaces.

### 3. Child changes own implementation detail; parent owns governance
The parent defines what good looks like (scope, gates, and quality criteria). Child changes define technical details for each flow.

### 4. Shared validation gate
Each child must pass:
- `pnpm lint`
- targeted `vitest run` for affected test files

## Risks / Trade-offs

- Parallel execution can create overlap if boundaries are not respected.
- Existing legacy test placement may differ from ideal mirror layout; child changes should improve where practical without broad refactors.
- Some flows may expose hidden coupling and require iterative scope tightening per child.
