## Purpose

Defines test coverage requirements for schedule add-on pricing behavior, including unit test scope, fixture strategy, isolation requirements, and test command availability.

## Requirements

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

### Requirement: Quantity-aware pricing behavior SHALL be covered by unit tests
The test suite SHALL include fixtures and assertions covering OPTIONAL add-on quantity multiplication for both HOURLY and FLAT pricing types, and SHALL assert that `quantity: 1` produces identical results to legacy binary selection.

#### Scenario: OPTIONAL HOURLY qty=2, 2 segments, rate=200
- **WHEN** an OPTIONAL HOURLY add-on with rate 200 cents is selected with `quantity: 2` and covers 2 segments
- **THEN** the add-on contribution is `200 × 2 × 2 = 800` cents (base 2000 → total 2800)

#### Scenario: OPTIONAL FLAT qty=3, flat_fee=500
- **WHEN** an OPTIONAL FLAT add-on with flat fee 500 cents is selected with `quantity: 3`
- **THEN** the flat contribution is `500 × 3 = 1500` cents charged once (base 2000 → total 3500)

#### Scenario: OPTIONAL qty=1 is equivalent to legacy binary selection
- **WHEN** an OPTIONAL add-on is selected with `quantity: 1`
- **THEN** the pricing result is identical to the legacy behavior where quantity was implicitly 1

### Requirement: Unit tests SHALL be runnable through a project command
Add-on pricing unit tests SHALL execute through a documented project command suitable for local development and CI checks.

#### Scenario: Repeatable test execution
- **WHEN** a developer runs the designated unit-test command
- **THEN** add-on pricing unit tests run deterministically and report pass/fail results without manual test setup steps
