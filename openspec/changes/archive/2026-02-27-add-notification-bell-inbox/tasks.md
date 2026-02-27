## 1. OpenSpec Artifacts

- [x] 1.1 Create proposal for `add-notification-bell-inbox`
- [x] 1.2 Create design documenting architecture, trade-offs, and migration
- [x] 1.3 Create spec deltas for notification boundary and domain behavior

## 2. Database + Schema

- [x] 2.1 Add `user_notification` Drizzle schema file with typed select/insert schemas
- [x] 2.2 Export `user_notification` from schema index
- [ ] 2.3 Generate and apply migration for `user_notification` (migration file added; DB apply blocked by network/DNS in current environment)

## 3. Backend Notification Inbox Module

- [x] 3.1 Add `user-notification` repository with list/count/read operations
- [x] 3.2 Add `user-notification` service and factory
- [x] 3.3 Add `user-notification` tRPC router (`listMy`, `unreadCount`, `markAsRead`, `markAllAsRead`)
- [x] 3.4 Register `userNotification` router in tRPC root

## 4. Notification Delivery Wiring

- [x] 4.1 Add inbox content resolver usage to notification delivery service
- [x] 4.2 Inject `user-notification` repository into notification delivery factory/service
- [x] 4.3 Persist inbox rows per resolved recipient user with idempotency keys

## 5. Frontend Data Layer + Hooks

- [x] 5.1 Extend notifications feature API with inbox query/mutation methods
- [x] 5.2 Add notification inbox hooks for list/unread/mark-read actions
- [x] 5.3 Add notification domain helper for badge text derivation

## 6. Bell Inbox UI

- [x] 6.1 Add notification inbox list component (loading/empty/list states)
- [x] 6.2 Update `NotificationBell` to show unread badge and inbox content
- [x] 6.3 Keep browser notification toggle section and denied hint behavior

## 7. Tests + Validation

- [x] 7.1 Add backend tests for user notification repository/service/router and delivery wiring
- [x] 7.2 Add/adjust frontend tests for bell badge, inbox render, and read actions
- [ ] 7.3 Run `pnpm lint` and fix issues in changed files (targeted lint green for changed files; full repo lint has unrelated pre-existing errors)
