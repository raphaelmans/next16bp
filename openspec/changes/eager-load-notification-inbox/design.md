## Context

The `NotificationBell` component currently passes `{ enabled: open }` to `useQueryNotificationInbox`, meaning notification items are only fetched when the user opens the popover. The unread count polls every 15s but the inbox query doesn't run until interaction.

The project has two existing Supabase realtime patterns:
- `src/common/clients/reservation-realtime-client/` — subscribes to `reservation_event` table INSERTs
- `src/common/clients/availability-realtime-client/` — subscribes to `availability_change_event` table INSERTs

Both follow the same architecture: low-level client → domain API → React hook → query invalidation.

Unlike those tables, `user_notification` contains user-specific data (notifications scoped by `user_id`). Supabase realtime with `postgres_changes` respects RLS, so enabling RLS with a `user_id = auth.uid()` policy ensures each client only receives their own notification events.

## Goals / Non-Goals

**Goals:**
- Eagerly fetch notification inbox data on mount so it is instantly available when the popover opens
- Subscribe to realtime `user_notification` INSERT events to invalidate queries instantly
- Enable RLS on `user_notification` for secure realtime event delivery
- Follow existing realtime client patterns for consistency

**Non-Goals:**
- Direct cache patching from realtime payloads (invalidation + refetch is sufficient for notification lists)
- Replacing the 15s unread count polling (keep as fallback; realtime supplements it)
- Adding pagination or infinite scroll to the inbox

## Decisions

### 1. Follow the availability-realtime-client pattern (simpler variant)

The `availability-realtime-client` is a single-file class without a separate "API" wrapper. Since notification realtime only needs to invalidate queries (no domain event mapping needed), use this simpler pattern.

**Alternative considered:** Full 3-layer pattern (client → API → hook) like reservations — rejected as over-engineering for simple invalidation.

### 2. Filter by `user_id` via RLS, not client-side filter

Use RLS (`user_id = auth.uid()`) so Supabase only delivers events for the authenticated user. This is both more secure and more efficient than subscribing to all inserts and filtering client-side.

**Alternative considered:** Client-side `filter` param on the channel — rejected because `user_notification` has sensitive data and all-user subscriptions are wasteful.

### 3. Invalidate, don't patch

On realtime INSERT, invalidate both `userNotification.unreadCount` and `userNotification.listMy` queries. The payload size is small (~20 items), so a refetch is cheap and avoids complex cache merging logic.

### 4. Remove `enabled: open` and add fallback `refetchInterval`

Remove the `{ enabled: open }` guard so inbox data loads on mount. Add `refetchInterval: 15_000` as a fallback in case the realtime connection drops. This matches the unread count polling cadence.

### 5. Enable RLS via Drizzle migration

Add a migration that enables RLS on `user_notification` and creates a SELECT policy for `auth.uid() = user_id`. This is required for Supabase realtime `postgres_changes` to filter by user.

## Risks / Trade-offs

- [RLS on existing table] → No breaking change; the app uses Drizzle (service role) for all CRUD, which bypasses RLS. RLS only affects Supabase realtime and direct client queries (which we don't use for this table).
- [Realtime connection overhead] → One additional channel per authenticated user. Supabase handles this well and the subscription is lightweight (INSERT only, RLS-filtered).
- [Fallback to polling if realtime unavailable] → The 15s `refetchInterval` ensures data stays fresh even if the realtime channel disconnects.
