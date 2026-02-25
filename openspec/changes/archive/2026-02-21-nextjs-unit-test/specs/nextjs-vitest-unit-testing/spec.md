## ADDED Requirements

### Requirement: Repository SHALL provide a Vitest unit-test runner for Next.js
The repository SHALL include a Vitest-based unit-test setup for Next.js that is executable from project scripts and usable in local and CI workflows.

#### Scenario: Unit test command is available
- **WHEN** a developer runs the documented unit-test script
- **THEN** Vitest executes and reports deterministic pass/fail results for repository unit tests

### Requirement: Vitest configuration SHALL support Next.js TypeScript aliases and React testing
The test configuration SHALL resolve TypeScript path aliases and support React component testing through the official plugin-based setup pattern.

#### Scenario: Alias imports resolve in tests
- **WHEN** a test imports code using repository aliases such as `@/`
- **THEN** the test runner resolves the alias without manual path rewriting

### Requirement: Unit test environment SHALL support DOM-oriented tests
The unit test setup SHALL provide a browser-like environment suitable for DOM-based unit tests.

#### Scenario: DOM test executes successfully
- **WHEN** a test renders a synchronous UI component and queries DOM roles/text
- **THEN** the test executes without environment errors and assertions can read rendered output

### Requirement: Unit tests SHALL follow mirrored `src/__tests__/` structure
All new unit tests introduced by this change SHALL be placed under `src/__tests__/` and mirror production source locations per project testing standards.

#### Scenario: Test file placement is deterministic
- **WHEN** a source module is selected for unit coverage
- **THEN** its test file is placed in a mirrored `src/__tests__/` path using `.test.ts` naming

### Requirement: Schedule add-on pricing behaviors SHALL be covered by unit tests
The unit suite SHALL include behavior tests for schedule add-on pricing covering OPTIONAL selection behavior, AUTO partial coverage warnings with `+0` uncovered contribution, HOURLY accumulation, FLAT one-time charging, and currency mismatch failure.

#### Scenario: Core pricing outcomes are asserted
- **WHEN** the schedule pricing unit tests run
- **THEN** assertions verify each documented add-on pricing behavior and failure/warning outcome

### Requirement: Court add-on service validation SHALL be covered by isolated unit tests
The unit suite SHALL include isolated service-layer tests for `CourtAddonService` using boundary doubles for repositories and transaction manager.

#### Scenario: Service invariants are enforced without infrastructure
- **WHEN** service-layer validation tests run for add-on payloads
- **THEN** tests assert type-specific required fields, overlap rejection, currency compatibility, and transaction participation behavior without DB or network dependencies

### Requirement: Async Server Component limitation SHALL be documented for unit testing scope
The testing guidance for this change SHALL explicitly state that async Server Components are out of scope for Vitest unit tests and are validated through E2E strategy.

#### Scenario: Scope guidance is explicit
- **WHEN** engineers read the new unit-test setup documentation or tasks
- **THEN** they can identify that async Server Components are excluded from this unit-test scope
