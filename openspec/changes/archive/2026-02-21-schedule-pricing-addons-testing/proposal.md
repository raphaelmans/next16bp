## Why

The recent `schedule-pricing-addons` implementation needs focused unit test coverage before the next UI integration wave. Adding tests now reduces regression risk and provides a stable baseline for integration work.

## What Changes

- Add unit tests for schedule pricing add-ons client logic and server service-layer behavior following project testing standards.
- Define deterministic test doubles and fixtures for core success, edge, and failure paths.
- Establish parity-oriented test scope for existing behavior; no product behavior changes are introduced.

## Capabilities

### New Capabilities

- `schedule-pricing-addons-testing`: Define test requirements and coverage expectations for schedule pricing add-ons across client and server unit-test layers.

### Modified Capabilities

- None.

## Impact

- Affects test files under `src/__tests__/features/**` and `src/__tests__/modules/**` for schedule pricing add-ons coverage.
- May add or update test fixtures/utilities used by these tests.
- No runtime API, database schema, or production behavior changes.
