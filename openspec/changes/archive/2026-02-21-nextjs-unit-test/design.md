## Context

The repo currently lacks a unit-test harness, while upcoming work requires fast, deterministic checks for pricing and service logic. Based on Next.js 16 documentation and Vitest documentation (via Context7), the recommended integration for App Router projects is Vitest with `@vitejs/plugin-react`, `jsdom`, and `vite-tsconfig-paths` for TypeScript path aliases.

Constraints and standards:
- Follow project testing layout (`src/__tests__/` mirror structure) from `guides/client/core/testing.md` and `guides/server/core/testing-service-layer.md`.
- Keep runtime behavior unchanged; this change is tooling + tests only.
- Account for Next.js caveat: async Server Components are not a primary unit-test target for Vitest; prefer E2E for those cases.

## Goals / Non-Goals

**Goals:**
- Install and configure Vitest for this Next.js 16 TypeScript repository with stable local/CI commands.
- Add baseline setup files and typings so tests are ergonomic (`describe/it/expect`) and browser-like DOM behavior is available when needed.
- Add first wave unit tests for schedule pricing add-ons and court-addon service invariants.
- Keep tests deterministic through fixtures and explicit test doubles.

**Non-Goals:**
- Replacing all existing validation or contract scripts.
- Adding E2E coverage in this change.
- Testing async Server Components via unit tests.

## Decisions

1. **Adopt Vitest as primary unit runner**
   - Decision: Use Vitest as the standard unit framework for client-safe and server/service unit tests.
   - Rationale: Officially documented Next.js integration exists, startup speed is high, and TypeScript support is first-class.
   - Alternatives considered:
     - Jest: mature ecosystem but additional Next/Jest setup overhead and slower default feedback loops.

2. **Use a dedicated `vitest.config.mts` with React + path plugins**
   - Decision: Configure Vitest with `@vitejs/plugin-react` and `vite-tsconfig-paths`, plus `test.environment = "jsdom"`.
   - Rationale: Aligns with Next.js guidance and ensures `@/` alias resolution works in tests.
   - Alternatives considered:
     - Split node/jsdom configs early: more granular but unnecessary complexity for initial rollout.

3. **Define shared setup and TypeScript test types**
   - Decision: Add a setup file for global test hooks/matchers and ensure tsconfig includes Vitest global/jsdom types where needed.
   - Rationale: Reduces per-test boilerplate and prevents editor/type friction.
   - Alternatives considered:
     - Explicit imports in every test file only: less config but more repetitive and error-prone.

4. **Scope first tests to high-risk pricing and validation logic**
   - Decision: Prioritize `computeSchedulePriceDetailed` behavior and `CourtAddonService` validation/transaction paths.
   - Rationale: These behaviors directly affect billing correctness and were recently implemented.
   - Alternatives considered:
     - Broad app-wide initial rollout: slower and less focused for immediate integration readiness.

## Risks / Trade-offs

- [Risk] jsdom for all tests may be slower for purely server logic -> Mitigation: start with one config for simplicity, then split environments if execution cost becomes material.
- [Risk] Confusion between contract scripts and unit-test responsibilities -> Mitigation: keep both and document that unit tests provide fast behavior checks while scripts preserve scenario parity.
- [Risk] Async Server Component limitations lead to false expectations -> Mitigation: explicitly scope unit tests to synchronous components and domain/service logic; defer async component verification to E2E.
- [Trade-off] New tooling increases maintenance surface -> Mitigation: keep configuration minimal and documented with stable scripts.

## Migration Plan

1. Add Vitest dependencies and base config (`vitest.config.mts`, setup file, scripts).
2. Add/adjust TypeScript typing support for Vitest globals and jsdom where required.
3. Create mirrored `src/__tests__/` directories with initial fixtures and tests.
4. Add schedule pricing unit tests and court-addon service unit tests.
5. Run `pnpm lint` and unit-test script; fix issues; document follow-up coverage gaps.

Rollback strategy:
- Tooling and tests can be reverted without runtime impact.
- Existing script-based checks remain available if unit setup is temporarily rolled back.

## Open Questions

- Should we add a separate CI lane for unit tests now or fold into existing lint gate first?
- Should we introduce dual-environment Vitest configs (`node` + `jsdom`) immediately after baseline setup?
