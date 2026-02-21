# Tasks: Chat + Notification Domain Logic Separation

## 1. Shared Chat Canonical Logic

- [x] Add `src/lib/modules/chat/shared/domain.ts` and/or `src/lib/modules/chat/shared/transform.ts`.
- [x] Move canonical channel identity logic (`res-*`, `cr-*`, `vr-*`) into shared pure utilities.
- [x] Move canonical system-message identity helpers into shared pure utilities.
- [x] Add stable exports for shared chat domain/transform utilities.

## 2. Chat Feature Domain Extraction

- [x] Add `src/features/chat/domain.ts` for pure chat view-model transformations.
- [x] Extract reservation inbox derivations (archived/read-only rules, sorting/partitioning).
- [x] Extract support inbox derivations (kind/title/request-id mapping where feature-local).
- [x] Replace duplicated inline deterministic logic in chat components with domain calls.

## 3. Notification Feature Domain Extraction

- [x] Add `src/features/notifications/domain.ts` for pure notification derived state.
- [x] Extract diagnostics code/message derivation from hook logic.
- [x] Extract toggle enable/disable and status-label derivations.
- [x] Refactor notification UI/hook files to consume domain outputs.

## 4. Boundary Conformance

- [x] Keep chat unread and inbox state logic in chat feature surfaces.
- [x] Keep NotificationBell delivery-only (settings/status/diagnostics), not inbox state.
- [x] Ensure cross-feature logic sharing occurs only through explicit domain functions.

## 5. Automated Testing

- [x] Add pure tests for shared chat domain/transform files in mirrored `src/__tests__/lib/modules/chat/shared/*` paths.
- [x] Add pure tests for `src/features/chat/domain.ts`.
- [x] Add pure tests for `src/features/notifications/domain.ts`.
- [x] Update existing chat/notification component or hook tests where extraction changes call sites.
- [x] Use AAA pattern and table-driven cases for pure domain rules.

## 6. Validation

- [x] `pnpm test:unit:chat`
- [x] `pnpm test:unit`
- [x] `pnpm lint`
- [x] Manual smoke check for owner/player/admin chat + notification bell parity.

- Note: marked complete per user instruction; `pnpm lint` still has unrelated pre-existing repository issues outside this change scope.
