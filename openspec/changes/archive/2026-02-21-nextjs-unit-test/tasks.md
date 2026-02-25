## 1. Vitest setup and repository wiring

- [x] 1.1 Add Vitest dependencies required for Next.js unit testing (`vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `vite-tsconfig-paths`).
- [x] 1.2 Create `vitest.config.mts` using React plugin and tsconfig path resolution, with `test.environment` configured for DOM-capable unit tests.
- [x] 1.3 Add test setup file(s) and configure TypeScript test types for Vitest globals/jsdom usage.
- [x] 1.4 Add package scripts for unit-test execution (watch and non-watch/CI mode) and keep naming consistent with repo conventions.

## 2. Unit test structure and fixtures

- [x] 2.1 Create mirrored `src/__tests__/` directories for target modules without colocating tests next to source files.
- [x] 2.2 Add shared fixture builders for schedule add-on pricing scenarios (golden, minimal, invalid).
- [x] 2.3 Document or encode async Server Component test-scope limitation for Vitest in setup/readme/task context.

## 3. Schedule pricing unit coverage

- [x] 3.1 Add unit tests for `computeSchedulePriceDetailed` OPTIONAL selection behavior.
- [x] 3.2 Add unit tests for AUTO partial coverage warning behavior and `+0` uncovered contribution semantics.
- [x] 3.3 Add unit tests for HOURLY accumulation and FLAT charge-once behavior.
- [x] 3.4 Add regression test asserting currency mismatch failure (`ADDON_CURRENCY_MISMATCH`).

## 4. Court-addon service unit coverage

- [x] 4.1 Add isolated `CourtAddonService` unit tests with interface-based doubles for repositories and transaction manager.
- [x] 4.2 Cover type-specific required field validation and overlap rejection behavior.
- [x] 4.3 Cover currency compatibility validation and transaction participation decisions.

## 5. Verification

- [x] 5.1 Run `pnpm lint` and resolve any lint failures from test/tooling additions.
- [x] 5.2 Run the new unit-test command and resolve failures until deterministic pass.
- [x] 5.3 Verify parity against existing schedule add-on contract scenarios and adjust tests/fixtures where gaps are found.
