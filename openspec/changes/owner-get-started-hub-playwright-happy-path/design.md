## Context

The owner setup hub currently orchestrates critical onboarding actions inside overlays/sheets, not route hops for most steps. Existing unit tests validate helper/hook logic, but there is no browser-level coverage for the integrated flow. Manual smoke docs still contain route-based expectations for steps that are now in-hub.

## Goals / Non-Goals

**Goals:**
- Standardize the setup-hub behavioral contract in OpenSpec.
- Introduce Playwright with a low-risk baseline (Chromium, local base URL, env-driven credentials).
- Ship one deterministic happy-path e2e spec that validates core setup actions are actionable.
- Align manual smoke docs with overlay-driven behavior.

**Non-Goals:**
- Full multi-browser matrix (Firefox/WebKit).
- Full onboarding matrix automation (claim/import/rejected verification permutations).
- CI rollout hardening beyond baseline local execution.

## Decisions

### D1: Minimal Playwright footprint first
- **Decision:** Install only `@playwright/test` and run Chromium-only.
- **Rationale:** Fastest stable baseline; reduces dependency and runtime overhead for first rollout.
- **Alternatives considered:**
  - Chromium+Firefox/WebKit immediately: broader coverage but slower and noisier while selectors stabilize.
  - Additional helper/reporter packages: unnecessary complexity for first slice.

### D2: Local server target with env-based base URL
- **Decision:** Use `E2E_BASE_URL` (default `http://localhost:3000`) in `playwright.config.ts`; no Playwright-managed webServer block.
- **Rationale:** Matches team workflow using local app runtime with staging-backed env credentials.
- **Alternatives considered:**
  - Hosted staging URL by default: adds external network/environment variability.
  - Auto-spawn dev server: less control over env selection and startup sequencing.

### D3: Login in each test, no shared storageState
- **Decision:** Authenticate through UI in each test via helper.
- **Rationale:** Matches chosen team preference and keeps each test self-contained.
- **Alternatives considered:**
  - Global setup + storage state: faster but diverges from requested auth strategy.

### D4: Adaptive happy-path assertions
- **Decision:** The first e2e spec uses pragmatic assertions that tolerate pre-existing setup state while still validating key actions and overlay accessibility.
- **Rationale:** Staging-backed accounts may already have partial setup; test should still provide value instead of hard-failing due preconditions.
- **Alternatives considered:**
  - Strict empty-account assumptions: cleaner semantics but brittle against shared staging data.

## Risks / Trade-offs

- **[Risk] Shared staging data can make setup-state assumptions unstable** -> **Mitigation:** Keep assertions adaptive and document dedicated test-account expectations.
- **[Risk] UI text/label changes can break selectors** -> **Mitigation:** Prefer role/label selectors and keep the initial suite intentionally small.
- **[Risk] Playwright suite may not run if credentials are missing** -> **Mitigation:** Explicit skip messaging when `E2E_OWNER_EMAIL` or `E2E_OWNER_PASSWORD` is not configured.

## Migration Plan

1. Add Playwright dependency and Chromium browser install.
2. Add Playwright config, scripts, ignore rules, and e2e env variable contract.
3. Add `tests/e2e/helpers/auth-login.ts` and initial happy-path spec.
4. Update owner setup smoke docs to reflect in-hub overlays.
5. Validate baseline by listing/running the new spec locally.

Rollback: remove Playwright config/scripts/tests and dependency updates; setup-hub runtime behavior remains unchanged.

## Open Questions

- Should the next increment introduce dedicated seeded test fixtures to remove adaptive assertions?
- Should claim/import variants be added as separate specs or folded into one broader onboarding suite?
