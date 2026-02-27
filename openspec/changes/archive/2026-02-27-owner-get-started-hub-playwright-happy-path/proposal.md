## Why

The owner get-started hub has been substantially refactored into modular cards and in-hub overlays, but current verification relies mostly on manual smoke checks and narrow unit tests. We need explicit OpenSpec coverage and an initial Playwright e2e baseline so setup regressions are caught before release.

## What Changes

- Capture the owner setup hub behavior as an explicit OpenSpec change, including overlay-driven steps for organization, venue, courts, verification, and import entry.
- Add Playwright e2e infrastructure to the repository (`@playwright/test`, config, scripts, and Chromium setup).
- Add the first authenticated happy-path Playwright spec for `/owner/get-started`.
- Update setup-hub smoke documentation to match current in-hub overlay behavior.

## Capabilities

### New Capabilities
- `owner-get-started-hub`: Define normative behavior for setup hub cards, prerequisites, and overlay transitions.
- `owner-get-started-playwright-happy-path`: Define baseline automated e2e coverage for the authenticated owner setup happy path.

### Modified Capabilities
- None.

## Impact

- Affected UI: `src/features/owner/components/get-started/**`, owner setup-related pages/components, and manual smoke docs.
- New testing infrastructure: Playwright config and `tests/e2e/**`.
- Package/tooling updates: `@playwright/test`, package scripts, `.gitignore`, and environment variables for e2e credentials.
