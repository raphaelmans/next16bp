## Why

Core user-facing flows currently have uneven test depth across server services, routers, and client adapters. We need a program-level testing proposal that prioritizes business-critical paths and enables parallel implementation without blocking on one large cutover.

## What Changes

- Establish a parent testing program that defines scope, sequencing, and quality gates for core-flow unit and integration-with-mocks coverage.
- Define the mandatory TDD approach for all child changes: red-green-refactor in vertical slices, behavior-first assertions, deterministic tests, and mocked external boundaries.
- Define parallel execution boundaries by splitting work into child flow proposals:
  - profile lifecycle
  - player court booking
  - owner onboarding/setup wizard
  - player-owner reservation lifecycle
  - team access RBAC
  - reservation notification routing and delivery
- Standardize validation gates for this program:
  - `pnpm lint`
  - targeted `vitest run` for changed test suites
  - no Playwright for this program

## Capabilities

### New Capabilities
- `core-feature-flow-testing-program`: Defines the core testing program contract, flow prioritization, parallel delivery model, and shared testing gates for child changes.

### Modified Capabilities
- None.

## Impact

- OpenSpec process:
  - Adds a parent contract for parallel test-work execution.
  - Child changes can proceed independently once approved.
- Codebase impact is deferred to child changes; this parent proposal introduces no runtime behavior change.
- Testing policy impact:
  - All work in this program uses unit + integration tests with mocks (no e2e requirement in scope).
