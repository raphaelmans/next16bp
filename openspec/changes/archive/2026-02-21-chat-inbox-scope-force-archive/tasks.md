# Tasks: Chat Inbox Scope + Force Archive

## 1. Data Model

- [x] Add `chat_inbox_archive` table.
- [x] Add unique index on `(user_id, thread_kind, thread_id)`.
- [x] Add read/write repository for archive records.

## 2. Backend Contracts

- [x] Add `chatInbox.archiveThread` mutation.
- [x] Add `chatInbox.unarchiveThread` mutation.
- [x] Add `chatInbox.listArchivedThreadIds` query.
- [x] Extend reservation thread meta retrieval to exclude archived by default.
- [x] Add optional `includeArchived` override (default false).

## 3. Reservation Inbox

- [x] Remove archive bucket UI.
- [x] Filter list to active + non-user-archived.
- [x] Add row/thread action to archive thread.
- [x] Add archived management view for manual unarchive.
- [x] Ensure refresh spinner tracks manual refresh only.

## 4. Support Inbox

- [x] Remove archive bucket UI.
- [x] Filter list by archived IDs (per-user).
- [x] Add row/thread action to archive thread.
- [x] Add archived management view for manual unarchive.

## 5. Notification Boundary

- [x] Keep NotificationBell as delivery settings/status only.
- [x] Add copy clarification: chat unread is in chat widget/inbox.

## 6. Validation

- [x] `pnpm lint`
- [x] Manual smoke matrix for owner/player/admin inboxes.
- [x] Verify force archive/unarchive per-user behavior.
- [x] Verify no stuck refresh loading state.

- Note: marked complete per user instruction; `pnpm lint` still has unrelated pre-existing repository issues outside this change scope.

## 7. Automated Chat Testing

- [x] Add Vitest setup/scripts using Next.js-compatible config baseline.
- [x] Add `chat-inbox.service` unit tests (validation, archive/unarchive, list).
- [x] Add `chat-inbox.router` unit tests (input/error mapping).
- [x] Add `reservation-chat.service.getThreadMetas` unit tests for default filtering + `includeArchived` override.
- [x] Add `features/chat/api` unit tests for `chatInbox` transport adapter behavior.
- [x] Add `features/chat/hooks/use-chat-trpc` unit tests for query/mutation adapter + invalidation utilities.
- [x] Add UI regression test for reservation manual refresh spinner lifecycle.
- [x] Add UI regression test for NotificationBell chat-vs-delivery boundary copy.
