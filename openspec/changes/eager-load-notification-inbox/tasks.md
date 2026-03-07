## 1. Database Setup

- [ ] 1.1 Create Drizzle migration to enable RLS on `user_notification` and add SELECT policy (`auth.uid() = user_id`)
- [ ] 1.2 Create `scripts/enable-realtime-user-notifications.ts` to add `user_notification` to `supabase_realtime` publication (follow `scripts/enable-realtime-availability-change-events.ts` pattern)
- [ ] 1.3 Run migration and enable-realtime script against dev database

## 2. Notification Realtime Client

- [ ] 2.1 Create `src/common/clients/notification-realtime-client/index.ts` following the `availability-realtime-client` pattern — subscribe to `user_notification` INSERT events via `postgres_changes`
- [ ] 2.2 Create `src/features/notifications/hooks/use-notification-realtime.ts` — hook that subscribes on mount and invalidates `userNotification.unreadCount` + `userNotification.listMy` on INSERT events

## 3. Eager Loading + Wiring

- [ ] 3.1 In `src/features/notifications/hooks/use-notification-inbox.ts`, add `refetchInterval: 15_000` to `useQueryNotificationInbox` options
- [ ] 3.2 In `src/features/notifications/components/notification-bell.tsx`, remove `{ enabled: open }` from `useQueryNotificationInbox` call
- [ ] 3.3 In `src/features/notifications/components/notification-bell.tsx`, wire up the notification realtime hook

## 4. Verification

- [ ] 4.1 Run `pnpm lint` to validate no type or lint errors
- [ ] 4.2 Manual verification: confirm notification data loads before popover opens (no loading skeleton on first open)
- [ ] 4.3 Manual verification: create a notification (e.g. reservation action) and confirm it appears instantly without waiting for poll interval
