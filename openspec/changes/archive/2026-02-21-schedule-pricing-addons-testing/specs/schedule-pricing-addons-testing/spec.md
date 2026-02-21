## ADDED Requirements

### Requirement: Add-on pricing behavior SHALL be covered by deterministic unit tests
The codebase SHALL include unit tests that verify schedule add-on pricing behavior for OPTIONAL selection, AUTO partial coverage, HOURLY accumulation, FLAT one-time charging, and currency mismatch failure.

#### Scenario: Core pricing semantics are asserted
- **WHEN** unit tests run against schedule add-on pricing logic
- **THEN** tests verify OPTIONAL unselected exclusion, AUTO uncovered `+0` behavior with warning, HOURLY segment accumulation, FLAT charge-once behavior, and `ADDON_CURRENCY_MISMATCH` failure

### Requirement: Service-layer add-on invariants SHALL be unit tested in isolation
The codebase SHALL include service-layer unit tests for add-on validation and rule invariants using interface-based doubles for repository and transaction boundaries.

#### Scenario: Validation paths are isolated from infrastructure
- **WHEN** service-layer tests execute for add-on create/update validation
- **THEN** tests assert type-specific required fields, overlap rejection, and currency compatibility decisions without DB or network dependencies

### Requirement: Unit test files SHALL follow mirrored `src/__tests__/` layout
All schedule-pricing-addons unit tests SHALL be placed under `src/__tests__/` paths that mirror source modules, and SHALL NOT be colocated next to production source files.

#### Scenario: Test location policy enforcement
- **WHEN** add-on pricing unit tests are added
- **THEN** each test file path can be derived by mirroring the source tree under `src/__tests__/` with `.test.ts` suffixing conventions

### Requirement: Add-on pricing test data SHALL include regression fixtures
The test suite SHALL maintain deterministic fixtures for representative valid, minimal valid, and invalid add-on pricing inputs to support regression prevention.

#### Scenario: Fixture tiers are available for coverage
- **WHEN** developers add or update add-on pricing tests
- **THEN** golden, minimal, and invalid fixture variants are available and used for coverage of success and failure paths

### Requirement: Unit tests SHALL be runnable through a project command
Add-on pricing unit tests SHALL execute through a documented project command suitable for local development and CI checks.

#### Scenario: Repeatable test execution
- **WHEN** a developer runs the designated unit-test command
- **THEN** add-on pricing unit tests run deterministically and report pass/fail results without manual test setup steps
