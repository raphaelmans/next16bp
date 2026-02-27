# owner-get-started-playwright-happy-path Specification

## Purpose
TBD - created by archiving change owner-get-started-hub-playwright-happy-path. Update Purpose after archive.
## Requirements
### Requirement: Baseline Playwright coverage SHALL exist for owner setup happy path
The repository SHALL include a Playwright e2e test that validates authenticated access and core setup actions on the owner get-started hub.

#### Scenario: Authenticated owner reaches setup hub and can trigger core actions
- **WHEN** Playwright runs with valid owner credentials
- **THEN** the test authenticates through the login UI if needed
- **AND** the test validates that core setup actions (organization, venue, courts, verification) are actionable from `/owner/get-started`

### Requirement: Playwright runtime configuration SHALL support local execution with staging-backed credentials
Playwright configuration SHALL support local test execution against a configurable base URL with explicit owner credential environment variables.

#### Scenario: Missing credentials are handled explicitly
- **WHEN** `E2E_OWNER_EMAIL` or `E2E_OWNER_PASSWORD` is not set
- **THEN** the happy-path test is skipped with a clear reason instead of failing with opaque selector/auth errors

#### Scenario: Chromium baseline is available
- **WHEN** developers run `pnpm test:e2e`
- **THEN** Playwright runs the suite using the configured Chromium project and repository test scripts

