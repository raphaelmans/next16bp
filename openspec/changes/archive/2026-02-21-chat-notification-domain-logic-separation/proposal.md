# Proposal: Chat + Notification Domain Logic Separation

## Why

Chat and notification features currently contain deterministic domain and view-model logic inside components and hooks. This increases branching inside UI files, duplicates rules across surfaces, and makes tests rely on heavy rendering and mocks instead of fast pure-function coverage.

We need to align these features with `guides/client/core/domain-logic.md` by separating:

- shared canonical logic that should be reusable in client and server
- feature-local UI/view-model transforms that remain pure
- IO and mutable concerns that stay in API classes and hooks

## What Changes

- Add shared chat domain/transform utilities under `src/lib/modules/chat/shared/*` for canonical channel and message identity rules.
- Add feature-local pure domain files for chat and notifications:
  - `src/features/chat/domain.ts`
  - `src/features/notifications/domain.ts`
- Refactor chat/notification components and hooks to consume domain outputs rather than re-implementing deterministic logic inline.
- Keep transport, side effects, and browser runtime operations in existing API/hook layers.

## Non-Goals

- No product UX redesign.
- No transport or endpoint contract changes.
- No changes to force archive behavior semantics introduced in `chat-inbox-scope-force-archive`.

## Capabilities

- Canonical chat ID rules are represented once and reused across client and server call sites.
- Chat inbox and thread derivations (sorting, labeling, read-only states) are testable via pure function tests.
- Notification diagnostics and toggle derivations are testable without browser/service-worker mocks.
- Components become thinner orchestration layers that are easier to integrate and maintain.

## Impact

- Affected frontend areas:
  - `src/features/chat/components/**`
  - `src/features/chat/hooks/**`
  - `src/features/notifications/components/**`
  - `src/features/notifications/hooks/**`
- Affected server area (reuse only):
  - `src/lib/modules/chat/services/chat-inbox.service.ts`
- New pure domain/shared tests in mirrored `src/__tests__/` paths.

## Testing Approach

- Add table-driven pure tests for new domain and shared files.
- Keep router/service tests focused on boundary behavior and contracts.
- Keep component tests focused on rendering and interaction orchestration (not re-testing pure invariants).
- Validate with `pnpm test:unit:chat`, `pnpm test:unit`, and `pnpm lint` plus manual smoke parity.
