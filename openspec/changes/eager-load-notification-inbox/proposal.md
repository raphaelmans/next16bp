## Why

The notification inbox data is lazy-loaded — it only fetches when the user opens the notification popover (`enabled: open`). This causes a visible loading state (skeleton) every time the user taps the bell icon, adding friction to a frequent interaction. Additionally, notification data relies entirely on polling (15s interval for unread count only), while the project already has Supabase realtime infrastructure for reservations and availability. Adding a realtime channel for notifications enables instant updates and eliminates the perceived delay.

## What Changes

- Add a Supabase realtime subscription for the `user_notification` table, following the existing `reservation-realtime-client` and `availability-realtime-client` patterns.
- Enable RLS on `user_notification` with a `user_id = auth.uid()` policy so realtime only delivers events for the authenticated user.
- Add the table to the `supabase_realtime` publication via a setup script.
- Remove the `enabled: open` guard from the `useQueryNotificationInbox` call in `NotificationBell`, so inbox items are fetched eagerly on mount.
- On realtime INSERT events, invalidate both the unread count and inbox queries instantly instead of waiting for the 15s polling interval.

## Capabilities

### New Capabilities

- `notification-realtime-sync`: Subscribe to realtime `user_notification` INSERT events and invalidate notification queries instantly.
- `eager-notification-inbox`: Eagerly prefetch notification inbox data so it is immediately available when the user opens the notification popover.

### Modified Capabilities

None.

## Impact

- New: `src/common/clients/notification-realtime-client/index.ts` — Supabase realtime client for `user_notification` table
- New: `src/features/notifications/hooks/use-notification-realtime.ts` — hook that subscribes and invalidates queries
- New: `scripts/enable-realtime-user-notifications.ts` — adds table to `supabase_realtime` publication
- New: Drizzle migration — enable RLS + add SELECT policy on `user_notification`
- Modified: `src/features/notifications/components/notification-bell.tsx` — remove `enabled: open`, wire up realtime hook
- Modified: `src/features/notifications/hooks/use-notification-inbox.ts` — add `refetchInterval` for fallback polling
