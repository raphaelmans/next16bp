## 1. Playwright Infrastructure

- [x] 1.1 Add `@playwright/test` and install Chromium browser support.
- [x] 1.2 Add Playwright scripts to `package.json` (`test:e2e`, `test:e2e:headed`, `test:e2e:ui`).
- [x] 1.3 Add `playwright.config.ts` with local `E2E_BASE_URL` support and Chromium-only project.
- [x] 1.4 Add e2e environment variable placeholders to `.env.example`.
- [x] 1.5 Add Playwright output artifacts to `.gitignore`.

## 2. Owner Get-Started Happy Path E2E

- [x] 2.1 Add shared auth helper for owner login in Playwright tests.
- [x] 2.2 Add `tests/e2e/owner-get-started.happy-path.spec.ts` to validate core setup actions and overlay entry points.
- [x] 2.3 Add explicit credential-guard skip behavior for missing e2e auth env vars.

## 3. Documentation and OpenSpec Capture

- [x] 3.1 Update owner setup smoke docs to reflect in-hub overlays for venue/courts/verification actions.
- [x] 3.2 Capture this change in OpenSpec proposal/design/specs/tasks artifacts under `owner-get-started-hub-playwright-happy-path`.
- [ ] 3.3 Run and record final verification checks (`pnpm test:e2e -- tests/e2e/owner-get-started.happy-path.spec.ts` and `pnpm lint`) after staging credentials are confirmed.
