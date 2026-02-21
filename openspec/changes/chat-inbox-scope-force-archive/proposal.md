# Proposal: Chat Inbox Scope + Force Archive

## Why

Current chat UX mixes operational inbox concerns with archived history and creates confusion with delivery notifications. Users need a clean inbox that reflects actionable chat only, plus a manual force-archive action for cleanup without deleting conversation history.

## What Changes

- Remove inline Archive bucket UI from reservation and support inbox surfaces.
- Keep inbox default to active/non-archived threads only.
- Add per-user force archive/unarchive for reservation and support threads.
- Keep unarchive manual-only in this phase (no auto-unarchive on new messages).
- Clarify chat vs notification boundary copy in NotificationBell.
- Fix refresh controls so spinning state tracks manual refresh only.

## Capabilities

- Add `chatInbox` APIs:
  - `archiveThread({ threadKind, threadId })`
  - `unarchiveThread({ threadKind, threadId })`
  - `listArchivedThreadIds({ threadKind })`
- Add `chat_inbox_archive` table for per-user archive overlay state.
- Extend reservation thread metas to support default exclusion and `includeArchived` override.

## Impact

- Affected specs: `chat-inbox`, `notification-boundary`
- Affected backend: chat module router/service/repository + DB schema/migration
- Affected frontend: reservation inbox, support inbox, shared chat thread header, notification bell copy

## Testing Approach

- Add Vitest unit-test baseline for this branch using the proven Next.js setup pattern from `staging`.
- Add server-layer tests for `chatInbox` service/router and reservation meta filtering behavior.
- Add client adapter tests for `features/chat/api.ts` and `features/chat/hooks/use-chat-trpc.ts`.
- Add focused UI regression tests for manual refresh spinner behavior and notification boundary copy.
- Keep async Server Components out of this unit scope; validate those via E2E/manual smoke checks.
