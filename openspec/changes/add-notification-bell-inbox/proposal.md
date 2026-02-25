## Why

The notification bell currently manages browser push settings only, which forces users to open separate surfaces to see recent notifications and misses common unread-badge UX expectations. We need a persisted in-app notification inbox in the bell while preserving the existing chat-vs-notification boundary.

## What Changes

- Add persisted user-facing notification inbox records (`user_notification`) with read/unread state.
- Add backend user-notification module (repository, service, factory, tRPC router) for list, unread count, mark-as-read, and mark-all-as-read.
- Wire notification enqueue flows to create inbox records per recipient user with idempotency.
- Add unread badge and recent-notifications list to `NotificationBell` popover.
- Keep chat unread/thread state in chat surfaces only; bell inbox remains notification-delivery domain, not chat inbox.

## Capabilities

### New Capabilities
- `notification-bell-inbox`: Persisted in-app notification inbox surfaced from the bell with unread badge and read actions.

### Modified Capabilities
- `notification-boundary`: NotificationBell expands from settings-only to settings + notification inbox while preserving chat separation.
- `chat-notification-boundary`: Clarify that bell inbox items are notification-delivery events, not chat thread state.
- `notification-domain-logic`: Add pure domain helpers for bell unread badge/view-model behavior.
- `chat-notification`: Update parent chat+notification contract to allow bell inbox within notification domain.

## Impact

- DB: New `user_notification` table and indexes.
- Backend: New module under `src/lib/modules/user-notification`; update notification-delivery factory/service wiring; register router in tRPC root.
- Frontend: Extend notifications feature API/hooks/domain and rework bell popover UI to include inbox list + unread badge.
- Testing: Add unit/component coverage for inbox domain behavior, delivery wiring, and bell interactions.
