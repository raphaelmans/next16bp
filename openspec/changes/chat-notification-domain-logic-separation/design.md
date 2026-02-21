# Design: Chat + Notification Domain Logic Separation

## Context

This change introduces a clean separation between pure deterministic logic and UI/IO orchestration for chat and notification features.

The target alignment is `guides/client/core/domain-logic.md`:

- shared canonical rules in `src/lib/modules/<module>/shared/*`
- feature-local pure view-model transforms in `src/features/<feature>/domain.ts`
- mutable runtime/transport concerns in hooks and API classes

## Architecture Decisions

## 1) Shared chat rules live in module-owned shared files

Canonical channel/message identity rules will be centralized in:

- `src/lib/modules/chat/shared/domain.ts`
- `src/lib/modules/chat/shared/transform.ts`

These files remain runtime-safe for both client and server:

- no DB, logger, env, or router imports
- no React/UI/browser-only imports

Expected responsibilities:

- parse and validate `res-*`, `cr-*`, `vr-*` channel identifiers
- derive canonical kind/request identifiers
- provide message identity helpers for system-message behavior where shared

## 2) Chat feature-local view-model logic lives in feature domain

UI-specific deterministic transforms move to:

- `src/features/chat/domain.ts`

Expected responsibilities:

- reservation read-only/archive derivation
- reservation inbox ordering/partitioning helpers
- support inbox display-label helpers that remain UI-specific

## 3) Notification feature-local view-model logic lives in feature domain

Notification derived-state logic moves to:

- `src/features/notifications/domain.ts`

Expected responsibilities:

- diagnostics code/message derivation from capability/permission/config state
- toggle disabled predicates and related display labels

## 4) UI/hook layers become orchestration-only

Components and hooks keep:

- lifecycle/event wiring
- mutation/query triggering
- rendering and user interaction handling

They delegate deterministic branch logic to pure domain/shared functions.

## Migration Strategy

1. Introduce shared chat domain/transform utilities.
2. Introduce `src/features/chat/domain.ts` and migrate one component at a time.
3. Introduce `src/features/notifications/domain.ts` and migrate hook/component logic.
4. Replace duplicated inline logic with function calls and remove dead helpers.
5. Stabilize tests with pure table-driven suites and thin component/hook tests.

## Testing Design

Pure deterministic tests (no mocks):

- `src/__tests__/lib/modules/chat/shared/domain.test.ts`
- `src/__tests__/features/chat/domain.test.ts`
- `src/__tests__/features/notifications/domain.test.ts`

Boundary/orchestration tests:

- existing service/router tests remain focused on contract behavior
- component tests validate interaction wiring and presentation, not duplicated pure invariants

## Compatibility and Risk

Behavioral intent is parity-only. Primary risks are regression from moved branching logic and accidental boundary leakage.

Mitigations:

- preserve existing behavior via table-driven domain tests before/after extraction
- keep shared files dependency-safe for both runtimes
- validate with `pnpm test:unit:chat`, `pnpm test:unit`, and manual smoke parity checks
