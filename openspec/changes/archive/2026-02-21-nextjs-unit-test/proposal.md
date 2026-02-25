## Why

The repository currently has no standardized unit-test runner, which blocks planned unit coverage for recent pricing work and slows safe iteration. We need a documented, project-wide Vitest setup aligned with Next.js 16 guidance so unit tests can be written and run consistently before deeper UI integration.

## What Changes

- Introduce Vitest-based unit testing for this Next.js 16 codebase using official Next.js and Vitest integration patterns.
- Add deterministic test runner configuration, setup files, and scripts for local and CI execution.
- Define first-wave unit testing scope for schedule-pricing add-on behavior and court-addon service validation.
- Establish mirrored `src/__tests__/` test layout and fixture conventions required by project testing standards.

## Capabilities

### New Capabilities

- `nextjs-vitest-unit-testing`: Define required behavior, configuration, and execution standards for unit testing with Vitest in this Next.js 16 repository.

### Modified Capabilities

- None.

## Impact

- Affects test tooling and scripts (`package.json`, Vitest config/setup files, and TypeScript test typing config).
- Adds unit test files and fixtures under mirrored `src/__tests__/` paths for targeted domains.
- Improves engineering confidence and regression detection without changing production runtime behavior.
