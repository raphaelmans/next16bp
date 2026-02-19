# Type Safety Cutover (Repo-Wide Assertion Purge)

## TL;DR

> **Quick Summary**: Remove unsafe type assertions and unnecessary `unknown` surfaces across the repo by restoring end-to-end typing via generics, typed procedure references, and boundary-only narrowing.
>
> **Deliverables**:
> - Fully typed feature hook wrappers (no `as never` / `as any[]`)
> - Fully typed feature APIs under `src/features/*/api.ts` (no `(input?: unknown) => Promise<unknown>`)
> - Remove `as any`, `as never`, `as unknown as` usage
> - Remove **all** TypeScript type assertions within `src/**` (`expr as T` and `<T>expr`), unless explicitly allowlisted
> - Replace Record-casts in mobile routes and jsonb handling with type guards / schema typing
> - Remove chat/mobile context type escapes; add Stream Chat custom field typing; remove ratelimit double-cast
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES (9 waves)
> **Critical Path**: Foundation typing → Feature API cutover → Cast cleanup → Final grep/type gates

---

## Context

### Original Request
- Investigate current usage of `unknown` and `as <T>`; assess whether it creates a false sense of truth.
- Direction: “proper generics → preserve type flow → narrowing as last resort.”
- Decision: “do cut-over for all” and select “repo-wide assertion purge.”

### Interview Summary
- Desired hierarchy:
  - Proper generics first.
  - Keep the same type through the data flow.
  - Type narrowing only at untrusted boundaries.
- Primary hotspots confirmed by repo scan:
  - `src/common/feature-api-hooks.ts` uses `as never` and returns `as any[]`.
  - `src/common/trpc-client-call.ts` uses dynamic string-path dispatch and returns `Promise<unknown>`.
  - Feature APIs under `src/features/*/api.ts` widely use `(input?: unknown) => Promise<unknown>`.
  - Mobile chat routes use `ctx: { session } as never`.
  - Stream Chat + ratelimit contain `as unknown as ...` double-casts.
  - Many `as Record<string, unknown>` casts exist across mobile routes and jsonb flows.

### Metis Review (gaps addressed)
- Guardrails: treat `src/common/feature-api-hooks.ts` and `src/common/trpc-client-call.ts` as blast-radius files; preserve runtime semantics.
- Explicit “purge” definition: prioritize eliminating `as any`, `as never`, `as unknown as`; use allowlist defaults for safe type-level cases (see Guardrails).
- Acceptance gates: `pnpm validate:client-arch`, `pnpm exec tsc --noEmit`, plus grep-based assertion gate.

---

## Work Objectives

### Core Objective
Restore real TypeScript type safety by eliminating unsafe assertions and `unknown` leakage across the client data chain, while keeping runtime behavior stable and narrowing only at trusted boundaries.

### Concrete Deliverables
- `src/common/feature-api-hooks.ts` fully generic and assertion-free (`as never`/`as any[]` removed).
- `src/common/trpc-client-call.ts` no longer performs dynamic dispatch for procedure invocation; no longer returns `Promise<unknown>`.
- `src/features/*/api.ts` methods typed from `AppRouter` (inputs/outputs inferred); no `(input?: unknown) => Promise<unknown>`.
- Remove known cast hotspots in feature hooks/components that were compensating for upstream `unknown`.
- Replace chat/mobile context escape hatches (`as never`) with minimal, correctly typed domain context.
- Stream Chat custom channel fields typed (module augmentation or generics) and `as unknown as Record<string, unknown>` removed where possible.
- `src/lib/shared/infra/ratelimit/ratelimit.ts` no longer uses `as unknown as RateLimiter`.
- Reduce/remove `as Record<string, unknown>` patterns repo-wide where they are only used for property access; replace with type guards.

### Definition of Done
- [ ] `pnpm validate:client-arch` → PASS
- [ ] `pnpm exec tsc --noEmit` → PASS
- [ ] Repo-wide grep gates for forbidden assertions meet policy (see Verification Strategy)

### Must NOT Have (Guardrails)
- No replacing one escape hatch with another (e.g. removing `as never` but adding `as unknown as`).
- No runtime behavior changes beyond narrowing/validation at true boundaries.
- No accidental value imports of server-only modules into client files (`"use client"` + `import type` only).

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO dedicated unit-test runner in `package.json`.
- **Automated tests**: None (default). Verification relies on typecheck + lint + deterministic smoke.

### Required Gates
- `pnpm validate:client-arch`
- `pnpm exec tsc --noEmit`
- Assertion gate (AST-based; do not rely on grep) with explicit allowlist policy:
  - Must reach **0** TypeScript type assertions in `src/**` (`AsExpression` / `TypeAssertionExpression`)
  - Must reach **0** occurrences of: `as any`, `as never`, `as unknown as`
  - `as Record<string, unknown>` and `raw as Record<string, unknown>` must be removed (use guards/schemas)
  - `as const` is allowed (non-failing) but must be treated as a last resort for literal unions/readonly; track occurrences in the gate output

### QA Policy
Each TODO includes agent-executed QA scenarios and evidence capture to `.sisyphus/evidence/`.
- First action in the run: `mkdir -p .sisyphus/evidence`.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Foundation — unblock all downstream work)
├── Task 1: Assertion gate script + baseline
├── Task 2: Shared type guards
├── Task 3: Genericify feature query/mutation wrappers
├── Task 4: Typed tRPC call wrapper (no dynamic dispatch)
├── Task 5: Shared tRPC inference types
├── Task 6: Stream Chat module augmentation
└── Task 7: Ratelimit adapter (remove double-cast)

Wave 2 (Small Feature API Cutover — max parallel)
├── Task 8: Organization API + hooks
├── Task 9: Auth API + hooks
├── Task 10: Contact API + hooks
├── Task 11: Health API + hooks
├── Task 12: Home API + hooks
├── Task 13: Notifications API + hooks
├── Task 14: Reservation API + hooks
└── Task 15: Support-chat API

Wave 3 (Discovery/Open-play/Admin + Chat API)
├── Task 16: Discovery API
├── Task 17: Discovery search hook assertions
├── Task 18: Open-play API + hooks
├── Task 19: Admin API
├── Task 20: Admin claims hook assertions
├── Task 21: Admin courts hook assertions
└── Task 28: Chat API

Wave 4 (Owner Cutover + Local Cleanup)
├── Task 22: Owner API
├── Task 23: Owner places hook assertions
├── Task 24: Owner reservations hook assertions
├── Task 25: Owner bookings-import hooks typing
├── Task 26: Bookings import review coordinator assertions
├── Task 27: Availability studio coordinator casts
└── Task 36: Owner place verification status casts

Wave 5 (Chat/Stream + Support Chat Context + Mobile Chat Routes)
├── Task 29: Stream client hook double-casts
├── Task 30: Chat UI double-casts
├── Task 31: Stream chat provider casts
├── Task 32: Reservation chat transcript cast
├── Task 33: Narrow support chat service ctx contract
├── Task 34: Mobile claim chat routes
└── Task 35: Mobile verification chat routes

Wave 6 (Mobile REST Route Cast Purge — set A)
├── Task 37: Reservation routes (owner)
├── Task 38: Bookings-import routes (owner)
├── Task 39: Court + hours routes
├── Task 40: Rate-rule routes
├── Task 41: Court blocks routes
└── Task 42: Organization routes

Wave 7 (Mobile REST Route Cast Purge — set B)
├── Task 43: Organization child routes
├── Task 44: Venue base + toggle routes
├── Task 45: Venue photos + courts routes
├── Task 46: Payment-method route
├── Task 47: Block routes
└── Task 48: Reservation chat message route

Wave 8 (Server/Shared Cast Purge)
├── Task 49: tRPC error adapter record casts
├── Task 50: organization.service record casts
├── Task 51: bookings-import.service metadata/enum casts
├── Task 52: ics-parser record cast
├── Task 53: cron notification payload casts
├── Task 54: google nearby route casts
└── Task 55: Zod modifySchema double-cast

Wave 9 (Final Gates Pre-Review)
├── Task 56: repo-wide forbidden assertion sweep
├── Task 57: tighten assertion gate to strict
└── Task 58: final lint/type evidence

Critical Path: 1-7 → 8-15 → (16-22 + 28) → 23-36 → 29-35 → 37-48 → 49-55 → 56-58 → Final Verification Wave

---

## TODOs

- [ ] 1. Add Assertion Gate Script + Baseline Policy

  **What to do**:
  - Create `scripts/quality/assertion-gate.ts` (run via `tsx`) that scans `src/**` for TypeScript **type assertions** and fails CI when not allowlisted.
  - Implementation requirement: use the TypeScript compiler API to detect and classify:
    - `expr as T` (`AsExpression`)
    - `<T>expr` (`TypeAssertionExpression`)
    - Special cases: `as any`, `as never`, `as unknown as`, `as const`
  - Add a baseline allowlist file `scripts/quality/assertion-baseline.json` so the gate can land early and then be tightened over time.
  - Add `pnpm lint:assertions` (e.g. `tsx scripts/quality/assertion-gate.ts`).
  - Ensure `.sisyphus/evidence/` exists (create if missing) for evidence artifacts.
  - Target policy (must trend to 0 by end):
    - Any TypeScript type assertion in `src/**` (both `as` and angle-bracket assertions)
    - Explicitly forbidden (always): `as any`, `as never`, `as unknown as`
    - Also remove (tracked early, enforced later): `as Record<string, unknown>` / `raw as Record<string, unknown>`
    - `as const` allowed: do not fail on it, but report it; prefer `satisfies` / explicit unions only when they do not reduce correctness
  - Add a `package.json` script entry (e.g. `lint:assertions`) and include it in a higher-level validation script only once the baseline reaches empty.

  **Must NOT do**:
  - Do not block the repo immediately by enforcing strict mode with no baseline on day 1.
  - Do not rely on grep/regex for correctness; AST scan is required to avoid false positives/negatives.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2-T7)
  - **Blocks**: Wave 4 final sweep (gate will be tightened there)
  - **Blocked By**: None

  **References**:
  - `package.json:5` - existing validation scripts and where to add assertion gate
  - `src/common/feature-api-hooks.ts` - currently contains `as never`/`as any[]` (used to seed baseline)
  - `src/lib/shared/infra/ratelimit/ratelimit.ts` - contains `as unknown as` (used to seed baseline)
  - `src/app/api/mobile/v1/owner/venues/[venueId]/route.ts` - contains `raw as Record<string, unknown>` (used to seed baseline)

  **Acceptance Criteria**:
  - [ ] New script exists and runs successfully with an initial baseline (no false positives on current code).
  - [ ] Evidence captured: baseline report saved.

  **QA Scenarios**:
  ```
  Scenario: Gate script runs with baseline
    Tool: Bash
    Steps:
      1. mkdir -p .sisyphus/evidence
      2. pnpm lint:assertions > .sisyphus/evidence/task-1-assertion-gate-baseline.txt
      3. Verify output lists current known hotspots (at least feature-api-hooks + ratelimit + one mobile route)
    Expected Result: Exit code 0, baseline file created/updated.
    Evidence: .sisyphus/evidence/task-1-assertion-gate-baseline.txt
  ```

  **Commit**: YES
  - Message: `chore(types): add assertion gate baseline`
  - Pre-commit: `pnpm lint`

- [ ] 2. Introduce Shared Type Guards (Boundary Narrowing)

  **What to do**:
  - Create a shared helper module for runtime narrowing (starting with `isRecord(value): value is Record<string, unknown>`).
  - Use it in a small number of central files that currently cast to `Record<string, unknown>` without a type guard.

  **Must NOT do**:
  - Do not spread ad-hoc guard helpers across many directories; centralize.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: mobile route cast purge tasks
  - **Blocked By**: None

  **References**:
  - `src/common/toast/errors.ts` - existing `isRecord` guard pattern to align with
  - `src/common/errors/adapters/trpc.ts:1` - current `asRecord` uses a cast; candidate to switch to guard

  **Acceptance Criteria**:
  - [ ] Shared guard module added and imported by at least one existing cast site.
  - [ ] `pnpm exec tsc --noEmit` passes for the touched files.

  **QA Scenarios**:
  ```
  Scenario: Typecheck passes after introducing guard
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-2-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-2-tsc.txt
  ```

  **Commit**: YES
  - Message: `chore(types): add shared type guards`

- [ ] 3. Genericify Feature Query/Mutation Wrappers (Remove `as never` / `as any[]`)

  **What to do**:
  - Refactor `src/common/feature-api-hooks.ts` to use TanStack Query types (`UseQueryOptions`, `UseMutationOptions`, etc.).
  - Ensure generics flow from `queryFn`/`mutationFn` (input/output) through to `UseQueryResult`/`UseMutationResult`.
  - Remove:
    - `as never` casts
    - `as any[]` return types
    - `TData = any` defaults

  **Must NOT do**:
  - Do not change runtime behavior of queries/mutations (only types + safe wrappers).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES (but best after T2 exists)
  - **Parallel Group**: Wave 1
  - **Blocks**: feature hook cast removals across all features
  - **Blocked By**: None

  **References**:
  - `src/common/feature-api-hooks.ts:17` - current `unknown`/`never`-cast approach
  - `src/features/chat/hooks/use-chat-trpc.ts` - representative call sites passing `options?: Record<string, unknown>`

  **Acceptance Criteria**:
  - [ ] `src/common/feature-api-hooks.ts` contains zero matches for `as never` and `as any`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: No forbidden casts in feature-api-hooks
    Tool: Bash
    Steps:
      1. Run a search for `as never` and `as any` in src/common/feature-api-hooks.ts and capture to .sisyphus/evidence/task-3-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-3-tsc.txt
    Expected Result: Search output empty for those patterns; typecheck passes.
    Evidence: .sisyphus/evidence/task-3-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type feature query hooks`

- [ ] 4. Refactor tRPC Call Wrapper to Typed Procedure References (Remove Dynamic Dispatch)

  **What to do**:
  - Replace string-path dynamic dispatch in `src/common/trpc-client-call.ts` with typed procedure references.
  - Keep `buildTrpcQueryKey` (path-based keys) for cache stability, but stop using path arrays to invoke procedures.
  - Ensure `callTrpcQuery`/`callTrpcMutation` return typed outputs (no `Promise<unknown>`).

  **Must NOT do**:
  - Do not import server runtime modules into this client file.
  - Do not change error normalization behavior (still use `toAppError`).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: all feature API migrations
  - **Blocked By**: None

  **References**:
  - `src/common/trpc-client-call.ts:31` - current dynamic dispatch and `Promise<unknown>` return
  - `src/trpc/client-api.ts:7` - typed `createTRPCClient<AppRouter>` client API surface

  **Acceptance Criteria**:
  - [ ] `src/common/trpc-client-call.ts` has no `getByPath` usage for invocation.
  - [ ] `callTrpcQuery`/`callTrpcMutation` no longer return `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Typecheck passes with new typed call layer
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-4-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-4-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type trpc call wrapper`

- [ ] 5. Add Shared tRPC Inference Types (RouterInputs/RouterOutputs)

  **What to do**:
  - Introduce a shared type-only module exporting `RouterInputs`/`RouterOutputs` derived from `AppRouter`.
  - Ensure all imports in client files are `import type` only.
  - Use this module as the canonical source for typing feature APIs.

  **Must NOT do**:
  - Do not create runtime coupling between client code and server code; this must be type-only.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: all feature API migrations (Wave 2+)
  - **Blocked By**: None

  **References**:
  - `src/trpc/client-api.ts:2` - already imports `AppRouter` type (client-safe pattern)

  **Acceptance Criteria**:
  - [ ] Shared type module exists and is used by at least one feature API.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Type-only import does not break typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-5-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-5-tsc.txt
  ```

  **Commit**: YES
  - Message: `chore(types): add trpc inference types`

- [ ] 6. Add Stream Chat Custom Field Typing Surface (Module Augmentation)

  **What to do**:
  - Add a `*.d.ts` module augmentation for `stream-chat` to type custom channel/user/message fields used by this app.
  - Goal: eliminate the need for `as unknown as Record<string, unknown>` when attaching custom channel fields.

  **Must NOT do**:
  - Do not widen types to `Record<string, unknown>`; declare the specific custom fields we actually use.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Stream Chat provider/client cast purge tasks
  - **Blocked By**: None

  **References**:
  - `src/lib/modules/chat/providers/stream-chat.provider.ts:117` - custom channel fields currently forced via double-cast
  - `src/lib/modules/chat/providers/stream-chat.provider.ts:223` - same pattern for support channels

  **Acceptance Criteria**:
  - [ ] Module augmentation file exists.
  - [ ] At least one Stream Chat double-cast site is removed as a proof of integration (full removal handled in later tasks).
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Typecheck sees stream-chat augmentation
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-6-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-6-tsc.txt
  ```

  **Commit**: YES
  - Message: `chore(types): type stream chat custom fields`

- [ ] 7. Remove Ratelimit Double-Cast via Adapter Type (No `as unknown as`)

  **What to do**:
  - Refactor `src/lib/shared/infra/ratelimit/ratelimit.ts` to eliminate `limiter as unknown as RateLimiter`.
  - Prefer: define `RateLimiter` as `Pick<Ratelimit, "limit">` or wrap the Upstash instance in a small adapter object.

  **Must NOT do**:
  - Do not change rate limiter runtime semantics.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: final `as unknown as` gate
  - **Blocked By**: None

  **References**:
  - `src/lib/shared/infra/ratelimit/ratelimit.ts:83` - current double-cast

  **Acceptance Criteria**:
  - [ ] `src/lib/shared/infra/ratelimit/ratelimit.ts` has 0 matches for `as unknown as`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Typecheck passes after ratelimit adapter
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-7-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-7-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove ratelimit double cast`

- [ ] 8. Cut Over Organization Feature API + Hooks (No `unknown` / No `as any`)

  **What to do**:
  - Type `src/features/organization/api.ts` methods using shared `RouterInputs/RouterOutputs`.
  - Update implementation to call typed tRPC procedures via the refactored call layer (no string-path dispatch).
  - Remove downstream casts in `src/features/organization/hooks.ts` (`data as ...`, `[x] as any`).

  **Must NOT do**:
  - Do not change runtime behavior of mutations; only typing + cast removal.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: none (leaf feature)
  - **Blocked By**: T3, T4, T5

  **References**:
  - `src/features/organization/api.ts:8` - current `(input?: unknown) => Promise<unknown>` surface
  - `src/features/organization/hooks.ts:16` - current `as any` cache set

  **Acceptance Criteria**:
  - [ ] `src/features/organization/api.ts` has no `Promise<unknown>` returns.
  - [ ] `src/features/organization/hooks.ts` has 0 matches for `as any`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Organization feature is assertion-free
    Tool: Bash
    Steps:
      1. Search `src/features/organization/api.ts` and `src/features/organization/hooks.ts` for `as any|as never|as unknown as` and save to .sisyphus/evidence/task-8-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-8-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-8-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type organization feature api`

- [ ] 9. Cut Over Auth Feature API + Hooks (Remove QueryFn Casts)

  **What to do**:
  - Type `src/features/auth/api.ts` inputs/outputs using `RouterInputs/RouterOutputs`.
  - Update `src/features/auth/hooks.ts` to remove `authApi.queryAuthMe as ...` casts and rely on inference.
  - Eliminate `unknown`-shaped mutation variable wrappers where possible (e.g. logout mutation wrapper should use `void` variables, not `unknown`).

  **Must NOT do**:
  - Do not broaden auth types; keep the narrowest accurate output types from router.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: other features that read auth session (discovery/owner flows)
  - **Blocked By**: T3, T4, T5

  **References**:
  - `src/features/auth/api.ts:8` - current unknown-typed API surface
  - `src/features/auth/hooks.ts:33` - current queryFn casts for session

  **Acceptance Criteria**:
  - [ ] `src/features/auth/api.ts` contains no `(input?: unknown) => Promise<unknown>` methods.
  - [ ] `src/features/auth/hooks.ts` contains no casts of `authApi.queryAuthMe`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Auth feature typecheck and cast purge
    Tool: Bash
    Steps:
      1. Search `src/features/auth/api.ts` and `src/features/auth/hooks.ts` for `as any|as never|as unknown as` and save to .sisyphus/evidence/task-9-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-9-tsc.txt
    Expected Result: grep output empty (or reduced to allowlisted safe cases); typecheck passes.
    Evidence: .sisyphus/evidence/task-9-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type auth feature api`

- [ ] 10. Cut Over Contact Feature API + Hooks

  **What to do**:
  - Type `src/features/contact/api.ts` mutation signature.
  - Confirm `src/features/contact/hooks.ts` infers correct `mutate` variables/output.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: none
  - **Blocked By**: T3, T4, T5

  **References**:
  - `src/features/contact/api.ts:8` - current unknown-typed mutation
  - `src/features/contact/hooks.ts:12` - simple hook wrapper to validate inference

  **Acceptance Criteria**:
  - [ ] `src/features/contact/api.ts` contains no `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Contact feature typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-10-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-10-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type contact feature api`

- [ ] 11. Cut Over Health Feature API + Hooks

  **What to do**:
  - Type `src/features/health/api.ts`.
  - Confirm `src/features/health/hooks.ts` infers output types from `useFeatureQuery`.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: none
  - **Blocked By**: T3, T4, T5

  **References**:
  - `src/features/health/api.ts:8` - unknown-typed query
  - `src/features/health/hooks.ts:8` - representative query hook

  **Acceptance Criteria**:
  - [ ] `src/features/health/api.ts` contains no `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Health feature typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-11-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-11-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type health feature api`

- [ ] 12. Cut Over Home Feature API + Hooks

  **What to do**:
  - Type `src/features/home/api.ts` queries.
  - Ensure `src/features/home/hooks.ts` queries infer correct data types.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: none
  - **Blocked By**: T3, T4, T5

  **References**:
  - `src/features/home/api.ts:8` - unknown-typed query API
  - `src/features/home/hooks.ts:12` - multiple queries that should infer types

  **Acceptance Criteria**:
  - [ ] `src/features/home/api.ts` contains no `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Home feature typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-12-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-12-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type home feature api`

- [ ] 13. Cut Over Notifications Feature API + Web Push Hook Types

  **What to do**:
  - Type `src/features/notifications/api.ts`.
  - Ensure `src/features/notifications/hooks/use-web-push.ts` uses inferred types for `vapidQuery.data` and mutation variables.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: none
  - **Blocked By**: T3, T4, T5

  **References**:
  - `src/features/notifications/api.ts:8` - unknown-typed API surface
  - `src/features/notifications/hooks/use-web-push.ts:58` - uses query data shape

  **Acceptance Criteria**:
  - [ ] `src/features/notifications/api.ts` contains no `Promise<unknown>`.
  - [ ] No new `as` assertions are introduced in `use-web-push.ts`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Notifications typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-13-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-13-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type notifications feature api`

- [ ] 14. Cut Over Reservation Feature API + Hook Types (Fix `useFeatureQueries` Usage)

  **What to do**:
  - Type `src/features/reservation/api.ts` queries/mutations.
  - Update `src/features/reservation/hooks.ts` to work with the new generic `useFeatureQueries` (remove any reliance on `any[]`).
  - Ensure mutation `variables` in `onSuccess`/`onError` are properly typed (no `unknown` fallbacks).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: discovery/owner flows that depend on reservation data
  - **Blocked By**: T3, T4, T5

  **References**:
  - `src/features/reservation/api.ts:8` - unknown-typed surface
  - `src/features/reservation/hooks.ts:7` - heavy user of feature-api-hooks helpers

  **Acceptance Criteria**:
  - [ ] `src/features/reservation/api.ts` contains no `Promise<unknown>`.
  - [ ] `src/features/reservation/hooks.ts` contains no `as any`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Reservation feature typecheck and cast sweep
    Tool: Bash
    Steps:
      1. Search `src/features/reservation/hooks.ts` for `as any|as never|as unknown as` and save to .sisyphus/evidence/task-14-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-14-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-14-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type reservation feature api`

- [ ] 15. Cut Over Support-Chat Feature API (Even If Unused)

  **What to do**:
  - Type `src/features/support-chat/api.ts` method signatures using `RouterInputs/RouterOutputs`.
  - Ensure implementation calls typed procedures via the new call layer.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: none
  - **Blocked By**: T4, T5

  **References**:
  - `src/features/support-chat/api.ts:8` - unknown-typed API surface

  **Acceptance Criteria**:
  - [ ] `src/features/support-chat/api.ts` contains no `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Support-chat api typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-15-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-15-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type support-chat feature api`

- [ ] 16. Cut Over Discovery Feature API

  **What to do**:
  - Type all procedures in `src/features/discovery/api.ts` using router inference.
  - Remove any remaining `unknown` input/output surface.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Discovery hook assertion purge task (T17)
  - **Blocked By**: T4, T5

  **References**:
  - `src/features/discovery/api.ts:8` - unknown-typed discovery API surface

  **Acceptance Criteria**:
  - [ ] `src/features/discovery/api.ts` contains no `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Discovery API typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-16-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-16-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type discovery feature api`

- [ ] 17. Purge Discovery Hook Type Assertions (Remove `as typeof query & { data: ... }`)

  **What to do**:
  - Remove the three return-type assertions in `src/features/discovery/hooks/search.ts` by making the transformed return type explicit without casting.
  - Preferred approach: use `useFeatureQuery` options (e.g. `select`) or restructure the function to return `{ query, data }` with concrete types.

  **Must NOT do**:
  - Do not reintroduce `as any`/`as unknown as` to “fix” typing.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: final assertion sweep
  - **Blocked By**: T3, T16

  **References**:
  - `src/features/discovery/hooks/search.ts:255` - first assertion
  - `src/features/discovery/hooks/search.ts:320` - second assertion
  - `src/features/discovery/hooks/search.ts:341` - third assertion

  **Acceptance Criteria**:
  - [ ] `src/features/discovery/hooks/search.ts` contains 0 matches for `as typeof query`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Discovery search hook assertion purge
    Tool: Bash
    Steps:
      1. Search for `as typeof query` in src/features/discovery/hooks/search.ts and save to .sisyphus/evidence/task-17-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-17-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-17-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove discovery hook assertions`

- [ ] 18. Cut Over Open-Play Feature API + Hooks

  **What to do**:
  - Type `src/features/open-play/api.ts`.
  - Ensure `src/features/open-play/hooks.ts` continues to infer correct `data` shapes for query + mutation callbacks.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: none
  - **Blocked By**: T3, T4, T5

  **References**:
  - `src/features/open-play/api.ts:8` - unknown-typed open-play surface
  - `src/features/open-play/hooks.ts:50` - depends on returned data shape

  **Acceptance Criteria**:
  - [ ] `src/features/open-play/api.ts` contains no `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Open-play feature typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-18-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-18-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type open-play feature api`

- [ ] 19. Cut Over Admin Feature API (Deep Path Procedures)

  **What to do**:
  - Type `src/features/admin/api.ts` procedures (note: nested admin router paths like `["admin","court","list"]`).
  - Ensure new typed call layer supports these procedure references without string-path dispatch.

  **Must NOT do**:
  - Do not keep `callTrpcQuery(clientApi, path, ...)` dynamic dispatch just to support deep paths; extend typing to cover it.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: admin hook cast purge tasks (T20-T21)
  - **Blocked By**: T4, T5

  **References**:
  - `src/features/admin/api.ts:8` - admin api surface with deep paths

  **Acceptance Criteria**:
  - [ ] `src/features/admin/api.ts` contains no `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Admin API typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-19-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-19-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type admin feature api`

- [ ] 20. Purge Admin Claims Hook Type Assertions (Remove `as ClaimType` / `as ClaimStatus`)

  **What to do**:
  - Replace `as ClaimType` and `as ClaimStatus` in `src/features/admin/hooks/claims.ts` with explicit mapping functions that return the correct union types.
  - Ensure transformations remain total (no unchecked string coercions).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: final assertion sweep
  - **Blocked By**: T19

  **References**:
  - `src/features/admin/hooks/claims.ts:176` - current `as ClaimType`
  - `src/features/admin/hooks/claims.ts:180` - current `as ClaimStatus`
  - `src/features/admin/hooks/claims.ts:227` - second occurrence

  **Acceptance Criteria**:
  - [ ] `src/features/admin/hooks/claims.ts` has 0 matches for `as ClaimType` and `as ClaimStatus`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Admin claims hook assertion purge
    Tool: Bash
    Steps:
      1. Search for `as ClaimType` and `as ClaimStatus` in src/features/admin/hooks/claims.ts and save to .sisyphus/evidence/task-20-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-20-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-20-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove admin claims assertions`

- [ ] 21. Purge Admin Courts Hook Type Assertions (Remove `query.data as ...`)

  **What to do**:
  - Remove `query.data as AdminCourtDetail | undefined` in `src/features/admin/hooks/courts.ts` by making the query return type correct end-to-end.
  - Ensure the transformed `useQueryAdminCourt` return is typed without casting.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: final assertion sweep
  - **Blocked By**: T19

  **References**:
  - `src/features/admin/hooks/courts.ts:234` - current cast to AdminCourtDetail

  **Acceptance Criteria**:
  - [ ] `src/features/admin/hooks/courts.ts` contains 0 matches for `data: query.data as`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Admin courts hook assertion purge
    Tool: Bash
    Steps:
      1. Search for `data: query.data as` in src/features/admin/hooks/courts.ts and save to .sisyphus/evidence/task-21-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-21-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-21-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove admin courts assertions`

- [ ] 22. Cut Over Owner Feature API (Largest API Surface)

  **What to do**:
  - Type `src/features/owner/api.ts` end-to-end using router inference.
  - Update all procedures to call typed tRPC procedure references (no string-path invocation).
  - Ensure the public `IOwnerApi` interface no longer exposes `unknown` input/output.

  **Must NOT do**:
  - Do not change method names or the singleton export pattern; keep surface stable.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES (but heavy)
  - **Parallel Group**: Wave 3
  - **Blocks**: all owner hook/component cast purge tasks
  - **Blocked By**: T4, T5

  **References**:
  - `src/features/owner/api.ts:8` - largest unknown-typed feature API surface

  **Acceptance Criteria**:
  - [ ] `src/features/owner/api.ts` contains 0 matches for `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Owner API typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-22-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-22-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type owner feature api`

- [ ] 23. Purge Owner Places Hook Assertions (Remove `query.data as ...` Casts)

  **What to do**:
  - Remove casts in `src/features/owner/hooks/places.ts` that exist due to `unknown` data flow.
  - Targets include:
    - `const places = (placesQuery.data ?? []) as OwnerPlaceRecord[];`
    - `query.data as CourtWithSportPayload[] | undefined`
    - `placeQuery.data as OwnerPlaceByIdResponse | undefined`
    - `if (!placePayload) return [] as OwnerCourt[];`
    - `const place = result as { id?: string } | undefined;`
  - Replace with proper inference from typed APIs and explicit local variable typing (no casts).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final owner assertion sweep
  - **Blocked By**: T22

  **References**:
  - `src/features/owner/hooks/places.ts:230` - `placesQuery.data` cast
  - `src/features/owner/hooks/places.ts:245` - courts query cast
  - `src/features/owner/hooks/places.ts:280` - place payload cast
  - `src/features/owner/hooks/places.ts:320` - empty array cast
  - `src/features/owner/hooks/places.ts:359` - mutation result cast

  **Acceptance Criteria**:
  - [ ] `src/features/owner/hooks/places.ts` has 0 matches for ` as Owner` and `data as ` patterns listed above.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Owner places hook assertion purge
    Tool: Bash
    Steps:
      1. Search for ` as OwnerPlaceRecord` and `data as CourtWithSportPayload` in src/features/owner/hooks/places.ts; save to .sisyphus/evidence/task-23-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-23-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-23-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove owner places assertions`

- [ ] 24. Purge Owner Reservations Hook Assertions (Remove `variables as ...` / `data as ...`)

  **What to do**:
  - Remove casts in `src/features/owner/hooks/reservations.ts` that compensate for unknown variables/data.
  - Targets include:
    - `(pendingCountQuery.data as number | undefined) ?? 0`
    - `select: (data: unknown) => { ... (data as OwnerReservationRecord[]) ... }`
    - `const payload = variables as { reservationId?: string } | undefined;` (multiple)
    - `(userOnSuccess as (...args: unknown[]) => unknown)(...)`
  - Replace with typed mutation variables and typed query outputs.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final owner assertion sweep
  - **Blocked By**: T22

  **References**:
  - `src/features/owner/hooks/reservations.ts:233` - pending count cast
  - `src/features/owner/hooks/reservations.ts:289` - `select` uses `data as ...`
  - `src/features/owner/hooks/reservations.ts:341` - `variables as ...` payload cast
  - `src/features/owner/hooks/reservations.ts:453` - user onSuccess cast

  **Acceptance Criteria**:
  - [ ] `src/features/owner/hooks/reservations.ts` contains no `select: (data: unknown)`.
  - [ ] `src/features/owner/hooks/reservations.ts` contains no `variables as` casts.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Owner reservations hook assertion purge
    Tool: Bash
    Steps:
      1. Search for `select: (data: unknown)` and `variables as` in src/features/owner/hooks/reservations.ts; save to .sisyphus/evidence/task-24-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-24-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-24-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove owner reservations assertions`

- [ ] 25. Type Owner Bookings-Import Hooks (Remove `input?: unknown` / Untyped Options)

  **What to do**:
  - Update `src/features/owner/hooks/bookings-import.ts` to:
    - accept properly typed `input` values (no `input?: unknown`)
    - accept properly typed React Query options (no `Record<string, unknown>`)
  - Rely on function-inferred generics from the typed owner API methods.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: bookings import UI assertion purge
  - **Blocked By**: T3, T22

  **References**:
  - `src/features/owner/hooks/bookings-import.ts:17` - current `input?: unknown` usage
  - `src/features/owner/hooks/bookings-import.ts:12` - current `options?: Record<string, unknown>`

  **Acceptance Criteria**:
  - [ ] `src/features/owner/hooks/bookings-import.ts` contains 0 matches for `input?: unknown`.
  - [ ] `src/features/owner/hooks/bookings-import.ts` contains 0 matches for `Record<string, unknown>` in options typing.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Owner bookings-import hooks typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-25-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-25-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type owner bookings import hooks`

- [ ] 26. Purge Bookings Import Review Coordinator Assertions (`as any`, `as Record`, `row as ...`)

  **What to do**:
  - Remove assertion hot spots in `src/features/owner/components/bookings-import/bookings-import-review-coordinator.tsx`:
    - `job.metadata as Record<string, unknown> | null` (use typed metadata or a guard)
    - `(job.metadata as Record<string, unknown>).selectedCourtId`
    - `updateRowMutation.mutate(payload as any)`
    - `row as RowRecord` casts
  - Ensure mutation variables are typed so `mutate(payload)` is correct without `any`.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as any`/`as Record` gate
  - **Blocked By**: T2, T3, T22, T25

  **References**:
  - `src/features/owner/components/bookings-import/bookings-import-review-coordinator.tsx:180` - metadata cast
  - `src/features/owner/components/bookings-import/bookings-import-review-coordinator.tsx:302` - selectedCourtId cast
  - `src/features/owner/components/bookings-import/bookings-import-review-coordinator.tsx:400` - `payload as any`

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `as any`.
  - [ ] File has 0 matches for `as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Bookings import coordinator assertion purge
    Tool: Bash
    Steps:
      1. Search for `as any|as Record<string, unknown>` in the file and save to .sisyphus/evidence/task-26-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-26-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-26-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge bookings import coordinator casts`

- [ ] 27. Purge Availability Studio Coordinator Metadata/Row Casts

  **What to do**:
  - Remove `as Record<string, unknown>` metadata cast in `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx`.
  - Remove `draftRows` cast (`(rowsQuery.data ?? []) as DraftRowItem[]`) by ensuring query typing is correct.
  - Use shared guard(s) for boundary values when needed.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as Record` gate
  - **Blocked By**: T2, T22

  **References**:
  - `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx:240` - metadata cast
  - `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx:253` - draftRows cast

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `as Record<string, unknown>`.
  - [ ] File has 0 matches for `as DraftRowItem[]`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Availability studio coordinator cast purge
    Tool: Bash
    Steps:
      1. Search for `as Record<string, unknown>` and `as DraftRowItem` in the file; save to .sisyphus/evidence/task-27-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-27-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-27-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge availability studio casts`

- [ ] 28. Cut Over Chat Feature API (Typed Inputs/Outputs)

  **What to do**:
  - Type `src/features/chat/api.ts` procedures using `RouterInputs/RouterOutputs`.
  - Ensure procedures that target other routers (`supportChat.*`, `reservationChat.*`) are typed correctly.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: chat cast purge tasks (T29-T32)
  - **Blocked By**: T4, T5

  **References**:
  - `src/features/chat/api.ts:8` - unknown-typed chat api surface

  **Acceptance Criteria**:
  - [ ] `src/features/chat/api.ts` contains no `Promise<unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Chat API typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-28-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-28-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): type chat feature api`

- [ ] 29. Purge Stream Client Hooks Double-Casts (`as unknown as`)

  **What to do**:
  - Remove `as unknown as` usage from:
    - `src/features/chat/hooks/useStreamClient.ts`
    - `src/features/chat/hooks/useStreamChannel.ts`
  - Prefer: correct Stream client typing (via module augmentation or library generics) + safe narrowing.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as unknown as` gate
  - **Blocked By**: T6 (stream types), T28

  **References**:
  - `src/features/chat/hooks/useStreamClient.ts:56` - current double-cast
  - `src/features/chat/hooks/useStreamClient.ts:75` - current double-cast
  - `src/features/chat/hooks/useStreamChannel.ts:29` - current double-cast

  **Acceptance Criteria**:
  - [ ] Both files contain 0 matches for `as unknown as`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Stream client hooks are double-cast free
    Tool: Bash
    Steps:
      1. Search both files for `as unknown as`; save to .sisyphus/evidence/task-29-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-29-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-29-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove stream client double casts`

- [ ] 30. Purge Chat UI Double-Casts (`as unknown as Record<string, unknown>`)

  **What to do**:
  - Remove `as unknown as Record<string, unknown>` usage from:
    - `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx`
    - `src/features/chat/components/unified-chat/unified-chat-interface.tsx`
  - Replace with typed Stream channel state/data access (via module augmentation) or safe type guards.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as unknown as` gate
  - **Blocked By**: T6

  **References**:
  - `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx:293` - current double-cast
  - `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx:458` - current double-cast
  - `src/features/chat/components/unified-chat/unified-chat-interface.tsx:186` - current double-cast

  **Acceptance Criteria**:
  - [ ] Both files contain 0 matches for `as unknown as`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Chat UI is double-cast free
    Tool: Bash
    Steps:
      1. Search both files for `as unknown as`; save to .sisyphus/evidence/task-30-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-30-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-30-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove chat ui double casts`

- [ ] 31. Purge Stream Chat Provider Double-Casts + Record Casts

  **What to do**:
  - Remove `as unknown as Record<string, unknown>` when creating channels in `src/lib/modules/chat/providers/stream-chat.provider.ts`.
  - Remove/replace the `channel as unknown as { query: ... }` cast by using correct Stream types.
  - Replace `m as Record<string, unknown>` message parsing with guard-based narrowing (`isRecord`).

  **Must NOT do**:
  - Do not reduce runtime safety: keep existing defensive `typeof` checks and error handling.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as unknown as` gate
  - **Blocked By**: T2, T6

  **References**:
  - `src/lib/modules/chat/providers/stream-chat.provider.ts:117` - reservation channel double-cast
  - `src/lib/modules/chat/providers/stream-chat.provider.ts:223` - support channel double-cast
  - `src/lib/modules/chat/providers/stream-chat.provider.ts:258` - channel query cast
  - `src/lib/modules/chat/providers/stream-chat.provider.ts:291` - message record cast

  **Acceptance Criteria**:
  - [ ] File contains 0 matches for `as unknown as`.
  - [ ] File contains 0 matches for `m as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Stream provider cast purge
    Tool: Bash
    Steps:
      1. Search for `as unknown as` in the file; save to .sisyphus/evidence/task-31-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-31-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-31-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge stream chat provider casts`

- [ ] 32. Purge Reservation Chat Service Transcript Cast (`as unknown as Record`)

  **What to do**:
  - Remove `exportPayload as unknown as Record<string, unknown>` in `src/lib/modules/chat/services/reservation-chat.service.ts`.
  - Replace with typed export payload structure or guard-based narrowing.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as unknown as` gate
  - **Blocked By**: T2

  **References**:
  - `src/lib/modules/chat/services/reservation-chat.service.ts:411` - transcriptJson double-cast

  **Acceptance Criteria**:
  - [ ] File contains 0 matches for `as unknown as`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Reservation chat service cast purge
    Tool: Bash
    Steps:
      1. Search for `as unknown as` in the file; save to .sisyphus/evidence/task-32-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-32-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-32-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge reservation chat casts`

- [ ] 33. Narrow Support Chat Service Context Contract (Remove Need for `ctx as never`)

  **What to do**:
  - Update `src/lib/modules/chat/services/support-chat.service.ts` to accept a minimal domain context type instead of `AuthenticatedContext` (only fields actually used).
  - Ensure both tRPC router (`src/lib/modules/chat/support-chat.router.ts`) and mobile route handlers can pass correct context without casting.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `backend-feature`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: NO (blocks route updates)
  - **Parallel Group**: Wave 5
  - **Blocks**: mobile chat route cast purge tasks (T34-T35)
  - **Blocked By**: None

  **References**:
  - `src/lib/modules/chat/services/support-chat.service.ts:227` - service expects `AuthenticatedContext`
  - `src/lib/shared/infra/trpc/context.ts:22` - current `AuthenticatedContext` shape
  - `src/lib/modules/chat/support-chat.router.ts:52` - passes full ctx today
  - `src/app/api/mobile/v1/owner/chat/claims/[claimRequestId]/session/route.ts:43` - casts ctx to never

  **Acceptance Criteria**:
  - [ ] `SupportChatService` no longer requires `AuthenticatedContext`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Support chat service contract typecheck
    Tool: Bash
    Steps:
      1. pnpm exec tsc --noEmit > .sisyphus/evidence/task-33-tsc.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-33-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): narrow support chat service ctx`

- [ ] 34. Purge Mobile Claim Chat Route Casts (`raw as Record`, `ctx as never`)

  **What to do**:
  - Update both claim chat route handlers:
    - `src/app/api/mobile/v1/owner/chat/claims/[claimRequestId]/session/route.ts`
    - `src/app/api/mobile/v1/owner/chat/claims/[claimRequestId]/messages/route.ts`
  - Replace `...(raw as Record<string, unknown>)` with guard-based spreading (`isRecord(raw) ? raw : {}`).
  - Remove `ctx: { session } as never` by passing the new minimal context type introduced in T33.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `backend-feature`, `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route assertion gate
  - **Blocked By**: T2, T33

  **References**:
  - `src/app/api/mobile/v1/owner/chat/claims/[claimRequestId]/messages/route.ts:45` - `raw as Record`
  - `src/app/api/mobile/v1/owner/chat/claims/[claimRequestId]/messages/route.ts:55` - `ctx as never`
  - `src/app/api/mobile/v1/owner/chat/claims/[claimRequestId]/session/route.ts:43` - `ctx as never`

  **Acceptance Criteria**:
  - [ ] Both files have 0 matches for `as never` and `as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Claim chat routes cast purge
    Tool: Bash
    Steps:
      1. Search both files for `as never|as Record<string, unknown>`; save to .sisyphus/evidence/task-34-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-34-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-34-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge claim chat route casts`

- [ ] 35. Purge Mobile Verification Chat Route Casts (`raw as Record`, `ctx as never`)

  **What to do**:
  - Update both verification chat route handlers:
    - `src/app/api/mobile/v1/owner/chat/verifications/[placeVerificationRequestId]/session/route.ts`
    - `src/app/api/mobile/v1/owner/chat/verifications/[placeVerificationRequestId]/messages/route.ts`
  - Remove `ctx as never` via T33.
  - Replace `raw as Record` spread with guard-based spreading.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `backend-feature`, `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route assertion gate
  - **Blocked By**: T2, T33

  **References**:
  - `src/app/api/mobile/v1/owner/chat/verifications/[placeVerificationRequestId]/messages/route.ts:45` - `raw as Record`
  - `src/app/api/mobile/v1/owner/chat/verifications/[placeVerificationRequestId]/messages/route.ts:55` - `ctx as never`
  - `src/app/api/mobile/v1/owner/chat/verifications/[placeVerificationRequestId]/session/route.ts:47` - `ctx as never`

  **Acceptance Criteria**:
  - [ ] Both files have 0 matches for `as never` and `as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Verification chat routes cast purge
    Tool: Bash
    Steps:
      1. Search both files for `as never|as Record<string, unknown>`; save to .sisyphus/evidence/task-35-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-35-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-35-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge verification chat route casts`

- [ ] 36. Purge Owner Place Verification Status Casts (`as PlaceVerificationStatus`)

  **What to do**:
  - Remove `as PlaceVerificationStatus` casts in `src/features/owner/hooks/place-verification.ts` by relying on typed API outputs or by mapping/validating the status value.
  - Ensure `select` callback remains fully typed (no `unknown` in/out).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-data`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final owner assertion sweep
  - **Blocked By**: T22

  **References**:
  - `src/features/owner/hooks/place-verification.ts:50` - cast site
  - `src/features/owner/hooks/place-verification.ts:59` - cast site

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `as PlaceVerificationStatus`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Owner place verification hook cast purge
    Tool: Bash
    Steps:
      1. Search for `as PlaceVerificationStatus` in the file; save to .sisyphus/evidence/task-36-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-36-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-36-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove place verification assertions`

- [ ] 37. Purge Mobile Owner Reservation Route Body Casts (3 routes)

  **What to do**:
  - Remove `...(raw as Record<string, unknown>)` patterns from:
    - `src/app/api/mobile/v1/owner/reservations/[reservationId]/confirm-payment/route.ts`
    - `src/app/api/mobile/v1/owner/reservations/[reservationId]/confirm-paid-offline/route.ts`
    - `src/app/api/mobile/v1/owner/reservations/[reservationId]/reject/route.ts`
  - Use `parseJson(req)` (unknown) + `isRecord(raw)` to safely spread.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] All three files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Reservation routes body cast purge
    Tool: Bash
    Steps:
      1. Search the three files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-37-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-37-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-37-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge reservation route body casts`

- [ ] 38. Purge Mobile Owner Bookings-Import Route Body Casts (3 routes)

  **What to do**:
  - Remove `...(raw as Record<string, unknown>)` patterns from:
    - `src/app/api/mobile/v1/owner/import/bookings/jobs/[jobId]/normalize/route.ts`
    - `src/app/api/mobile/v1/owner/import/bookings/rows/[rowId]/replace-with-guest/route.ts`
    - `src/app/api/mobile/v1/owner/import/bookings/rows/[rowId]/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] All three files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Bookings-import routes body cast purge
    Tool: Bash
    Steps:
      1. Search the three files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-38-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-38-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-38-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge bookings-import route body casts`

- [ ] 39. Purge Mobile Owner Court + Hours Route Body Casts (3 routes)

  **What to do**:
  - Remove raw body casts from:
    - `src/app/api/mobile/v1/owner/courts/[courtId]/route.ts`
    - `src/app/api/mobile/v1/owner/courts/[courtId]/hours/route.ts`
    - `src/app/api/mobile/v1/owner/courts/[courtId]/hours/copy-from/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] All three files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Court/hour routes body cast purge
    Tool: Bash
    Steps:
      1. Search the three files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-39-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-39-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-39-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge court route body casts`

- [ ] 40. Purge Mobile Owner Court Rate-Rules Route Body Casts (2 routes)

  **What to do**:
  - Remove raw body casts from:
    - `src/app/api/mobile/v1/owner/courts/[courtId]/rate-rules/route.ts`
    - `src/app/api/mobile/v1/owner/courts/[courtId]/rate-rules/copy-from/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] Both files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Rate-rule routes body cast purge
    Tool: Bash
    Steps:
      1. Search both files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-40-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-40-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-40-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge rate-rule route body casts`

- [ ] 41. Purge Mobile Owner Court Blocks Route Body Casts (2 routes)

  **What to do**:
  - Remove raw body casts from:
    - `src/app/api/mobile/v1/owner/courts/[courtId]/blocks/maintenance/route.ts`
    - `src/app/api/mobile/v1/owner/courts/[courtId]/blocks/walk-in/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] Both files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Court blocks routes body cast purge
    Tool: Bash
    Steps:
      1. Search both files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-41-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-41-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-41-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge court block route body casts`

- [ ] 42. Purge Mobile Owner Organization Route Body Casts (2 routes)

  **What to do**:
  - Remove raw body casts from:
    - `src/app/api/mobile/v1/owner/organizations/[organizationId]/route.ts`
    - `src/app/api/mobile/v1/owner/organizations/[organizationId]/profile/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] Both files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Organization routes body cast purge
    Tool: Bash
    Steps:
      1. Search both files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-42-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-42-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-42-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge organization route body casts`

- [ ] 43. Purge Mobile Owner Organization Child Route Body Casts (3 routes)

  **What to do**:
  - Remove raw body casts from:
    - `src/app/api/mobile/v1/owner/organizations/[organizationId]/venues/route.ts`
    - `src/app/api/mobile/v1/owner/organizations/[organizationId]/guest-profiles/route.ts`
    - `src/app/api/mobile/v1/owner/organizations/[organizationId]/payment-methods/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] All three files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Organization child routes body cast purge
    Tool: Bash
    Steps:
      1. Search the three files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-43-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-43-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-43-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge organization child route body casts`

- [ ] 44. Purge Mobile Owner Venue Base + Toggle Route Body Casts (2 routes)

  **What to do**:
  - Remove raw body casts from:
    - `src/app/api/mobile/v1/owner/venues/[venueId]/route.ts`
    - `src/app/api/mobile/v1/owner/venues/[venueId]/reservations/toggle/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] Both files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Venue base/toggle routes body cast purge
    Tool: Bash
    Steps:
      1. Search both files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-44-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-44-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-44-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge venue route body casts`

- [ ] 45. Purge Mobile Owner Venue Photos + Courts Route Body Casts (2 routes)

  **What to do**:
  - Remove raw body casts from:
    - `src/app/api/mobile/v1/owner/venues/[venueId]/photos/reorder/route.ts`
    - `src/app/api/mobile/v1/owner/venues/[venueId]/courts/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] Both files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Venue photos/courts routes body cast purge
    Tool: Bash
    Steps:
      1. Search both files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-45-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-45-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-45-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge venue child route body casts`

- [ ] 46. Purge Mobile Owner Payment-Method Route Body Casts (1 route)

  **What to do**:
  - Remove raw body casts from `src/app/api/mobile/v1/owner/payment-methods/[paymentMethodId]/route.ts`.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Payment-method route body cast purge
    Tool: Bash
    Steps:
      1. Search the file for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-46-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-46-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-46-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge payment-method route body casts`

- [ ] 47. Purge Mobile Owner Blocks Route Body Casts (2 routes)

  **What to do**:
  - Remove raw body casts from:
    - `src/app/api/mobile/v1/owner/blocks/[blockId]/range/route.ts`
    - `src/app/api/mobile/v1/owner/blocks/[blockId]/convert-to-guest/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] Both files have 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Blocks routes body cast purge
    Tool: Bash
    Steps:
      1. Search both files for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-47-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-47-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-47-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge blocks route body casts`

- [ ] 48. Purge Mobile Owner Reservation Chat Message Route Body Casts (1 route)

  **What to do**:
  - Remove raw body casts from `src/app/api/mobile/v1/owner/chat/reservations/[reservationId]/messages/route.ts`.
  - Use `isRecord(raw)` to spread safely before validation.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final mobile route cast gate
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `raw as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Reservation chat message route body cast purge
    Tool: Bash
    Steps:
      1. Search the file for `raw as Record<string, unknown>`; save to .sisyphus/evidence/task-48-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-48-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-48-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): purge reservation chat message body casts`

- [ ] 49. Purge tRPC Error Meta Adapter Record Casts

  **What to do**:
  - Refactor `src/common/errors/adapters/trpc.ts` to eliminate `(value as Record<string, unknown>)` by using the shared `isRecord` type guard.
  - Keep behavior identical: only extracts optional meta fields.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as Record` gate
  - **Blocked By**: T2

  **References**:
  - `src/common/errors/adapters/trpc.ts:1` - current cast-based adapter

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `value as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: trpc error meta adapter cast purge
    Tool: Bash
    Steps:
      1. Search for `as Record<string, unknown>` in src/common/errors/adapters/trpc.ts; save to .sisyphus/evidence/task-49-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-49-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-49-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove trpc error adapter casts`

- [ ] 50. Purge Organization Service Record Casts (Recursive Route Base Collector)

  **What to do**:
  - Replace casts in `src/lib/modules/organization/services/organization.service.ts`:
    - `(node as { base?: unknown }).base`
    - `Object.values(node as Record<string, unknown>)`
  - Use `isRecord(node)` + property checks.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as Record` gate
  - **Blocked By**: T2

  **References**:
  - `src/lib/modules/organization/services/organization.service.ts:44` - base property cast
  - `src/lib/modules/organization/services/organization.service.ts:49` - values record cast

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `node as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Organization service cast purge
    Tool: Bash
    Steps:
      1. Search for `as Record<string, unknown>` in the file; save to .sisyphus/evidence/task-50-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-50-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-50-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove organization service record casts`

- [ ] 51. Purge Bookings Import Service Metadata + Enum Casts

  **What to do**:
  - Remove casts in `src/lib/modules/bookings-import/services/bookings-import.service.ts` around `job.metadata` and `job.sourceType`.
  - Use `isRecord(job.metadata)` for safe property access.
  - Replace `job.sourceType as ImportSource` with typed sourceType (prefer schema typing or explicit mapping).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `supabase-postgres-best-practices`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final bookings import assertion sweep
  - **Blocked By**: T2

  **References**:
  - `src/lib/modules/bookings-import/services/bookings-import.service.ts:704` - `job.metadata as Record...`
  - `src/lib/modules/bookings-import/services/bookings-import.service.ts:719` - `job.sourceType as ImportSource`

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `job.metadata as Record<string, unknown>`.
  - [ ] File has 0 matches for ` as ImportSource`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Bookings import service cast purge
    Tool: Bash
    Steps:
      1. Search for `as Record<string, unknown>` and `as ImportSource` in the file; save to .sisyphus/evidence/task-51-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-51-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-51-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove bookings import service casts`

- [ ] 52. Purge ICS Parser Record Cast

  **What to do**:
  - Replace `const record = item as Record<string, unknown>;` in `src/lib/modules/bookings-import/lib/ics-parser.ts` with guard-based narrowing.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: final `as Record` gate
  - **Blocked By**: T2

  **References**:
  - `src/lib/modules/bookings-import/lib/ics-parser.ts:34` - current record cast

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `item as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: ICS parser cast purge
    Tool: Bash
    Steps:
      1. Search for `as Record<string, unknown>` in the file; save to .sisyphus/evidence/task-52-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-52-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-52-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove ics parser record cast`

- [ ] 53. Purge Cron Notification Delivery Job Payload Casts

  **What to do**:
  - In `src/app/api/cron/dispatch-notification-delivery/route.ts`, remove `job.payload as Record<string, unknown> | null` casts by:
    - changing `parse*Payload` helpers to accept `unknown` (Zod safeParse already accepts unknown)
    - calling `safeParse(job.payload)` directly
  - Ensure the Zod schemas remain the single source of truth for payload shapes.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `backend-feature`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final `as Record` gate
  - **Blocked By**: None

  **References**:
  - `src/app/api/cron/dispatch-notification-delivery/route.ts:124` - parse helpers accept `Record<string, unknown>` today
  - `src/app/api/cron/dispatch-notification-delivery/route.ts:464` - first cast site

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `job.payload as Record<string, unknown>`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Cron payload cast purge
    Tool: Bash
    Steps:
      1. Search for `job.payload as Record<string, unknown>` in the file; save to .sisyphus/evidence/task-53-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-53-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-53-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove cron payload casts`

- [ ] 54. Purge Google Nearby Route Casts (Request + Response)

  **What to do**:
  - In `src/app/api/poc/google-loc/nearby/route.ts`:
    - replace `const payload = body as Record<string, unknown>` with `isRecord(body)` narrowing
    - replace `const json = (await response.json()) as { ... }` with Zod validation or guard-based extraction

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `owasp-security`, `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5
  - **Blocks**: final `as Record` gate
  - **Blocked By**: T2

  **References**:
  - `src/app/api/poc/google-loc/nearby/route.ts:75` - body cast
  - `src/app/api/poc/google-loc/nearby/route.ts:104` - response json cast

  **Acceptance Criteria**:
  - [ ] File has 0 matches for `as Record<string, unknown>`.
  - [ ] File has 0 matches for `await response.json()) as`.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Nearby route cast purge
    Tool: Bash
    Steps:
      1. Search for `as Record<string, unknown>` and `response.json()) as` in the file; save to .sisyphus/evidence/task-54-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-54-tsc.txt
    Expected Result: grep output empty; typecheck passes.
    Evidence: .sisyphus/evidence/task-54-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): remove google nearby route casts`

- [ ] 55. Remove Zod Schema Helper Double-Cast (`modifySchema`)

  **What to do**:
  - Attempt to remove `as unknown as` from `src/common/schemas.ts` `modifySchema` helper.
  - If TypeScript cannot express the relationship without a cast, convert this to an explicit allowlist exception:
    - keep the cast but document why it is unavoidable and ensure the assertion gate allowlist is narrowly scoped to this line only.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6
  - **Blocks**: final `as unknown as` gate
  - **Blocked By**: None

  **References**:
  - `src/common/schemas.ts:49` - current `as unknown as` cast

  **Acceptance Criteria**:
  - [ ] Either (a) file has 0 matches for `as unknown as`, or (b) allowlist is updated to include only this exact line with rationale.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Zod helper cast outcome is explicit
    Tool: Bash
    Steps:
      1. Search for `as unknown as` in src/common/schemas.ts; save to .sisyphus/evidence/task-55-grep.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-55-tsc.txt
    Expected Result: Either grep empty OR allowlist updated with documented exception; typecheck passes.
    Evidence: .sisyphus/evidence/task-55-tsc.txt
  ```

  **Commit**: YES
  - Message: `refactor(types): reduce zod helper assertion`

- [ ] 56. Repo-Wide Final Sweep: Eliminate Remaining Forbidden Assertions

  **What to do**:
  - Run the assertion gate script from T1 and identify any remaining occurrences of:
    - `as any`
    - `as never`
    - `as unknown as`
  - For each remaining match:
    - remove it via proper typing / procedure references / type guards
    - if the match is genuinely unavoidable, add a narrowly scoped allowlist entry with rationale

  **Must NOT do**:
  - Do not broaden allowlist to “make it pass”; only allowlist cases with clear type-level necessity.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: NO (final integration pass)
  - **Parallel Group**: Wave 6
  - **Blocks**: tightening the gate (T57)
  - **Blocked By**: All prior cast-purge tasks

  **References**:
  - Assertion patterns inventory (starting point):
    - `src/common/feature-api-hooks.ts` (`as never`, `as any[]`)
    - Mobile chat routes (`ctx as never`)
    - Stream/ratelimit/chat double-casts (`as unknown as`)

  **Acceptance Criteria**:
  - [ ] Assertion gate reports 0 occurrences of forbidden patterns outside the allowlist.
  - [ ] `pnpm exec tsc --noEmit` passes.

  **QA Scenarios**:
  ```
  Scenario: Forbidden assertion sweep passes
    Tool: Bash
    Steps:
      1. pnpm lint:assertions > .sisyphus/evidence/task-56-assertion-gate.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-56-tsc.txt
    Expected Result: Gate PASS; typecheck PASS.
    Evidence: .sisyphus/evidence/task-56-assertion-gate.txt
  ```

  **Commit**: YES
  - Message: `chore(types): finish forbidden assertion purge`

- [ ] 57. Tighten Assertion Gate: Baseline → Strict Enforcement

  **What to do**:
  - Empty or remove `scripts/quality/assertion-baseline.json` so `pnpm lint:assertions` is strict.
  - Wire `pnpm lint:assertions` into the main validation command (e.g. `pnpm validate:client-arch`).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6
  - **Blocks**: final verification wave
  - **Blocked By**: T56

  **References**:
  - `package.json:12` - `validate:client-arch` current composition

  **Acceptance Criteria**:
  - [ ] Running the strict gate fails on any new forbidden assertion.
  - [ ] `pnpm validate:client-arch` passes on the final code state.

  **QA Scenarios**:
  ```
  Scenario: Strict validation gate passes
    Tool: Bash
    Steps:
      1. pnpm validate:client-arch > .sisyphus/evidence/task-57-validate-client-arch.txt
    Expected Result: Exit code 0.
    Evidence: .sisyphus/evidence/task-57-validate-client-arch.txt
  ```

  **Commit**: YES
  - Message: `chore(types): enforce assertion gate`

- [ ] 58. Final Local Type + Lint Gate (Pre-Review)

  **What to do**:
  - Run the full verification commands and capture evidence for the final review agents:
    - `pnpm validate:client-arch`
    - `pnpm exec tsc --noEmit`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `vercel-react-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6
  - **Blocks**: Final Verification Wave (F1-F4)
  - **Blocked By**: T57

  **Acceptance Criteria**:
  - [ ] Evidence files exist for lint + typecheck gates.

  **QA Scenarios**:
  ```
  Scenario: Final gate commands
    Tool: Bash
    Steps:
      1. pnpm validate:client-arch > .sisyphus/evidence/task-58-validate-client-arch.txt
      2. pnpm exec tsc --noEmit > .sisyphus/evidence/task-58-tsc.txt
    Expected Result: Exit code 0 for both.
    Evidence: .sisyphus/evidence/task-58-tsc.txt
  ```

  **Commit**: NO

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. Plan Compliance Audit — `oracle`
- [ ] F2. Code Quality Review — `unspecified-high`
- [ ] F3. Real Manual QA — `unspecified-high` (+ `playwright` if UI smoke is needed)
- [ ] F4. Scope Fidelity Check — `deep`

---

## Commit Strategy

- Prefer small, reversible commits grouped by wave/module (foundation, per-feature cutover, chat/mobile, cleanup/gates).

---

## Success Criteria

### Verification Commands
```bash
pnpm validate:client-arch
pnpm exec tsc --noEmit
```

### Final Checklist
- [ ] `pnpm validate:client-arch` PASS
- [ ] `pnpm exec tsc --noEmit` PASS
- [ ] Forbidden assertion patterns meet policy (0 occurrences or allowlisted)
- [ ] No runtime behavior regressions observed in smoke scenarios
