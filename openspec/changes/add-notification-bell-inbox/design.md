## Context

`NotificationBell` currently exposes only web-push toggle state. The system already enqueues delivery jobs (`notification_delivery_job`) for email/SMS/push channels, but there is no user-facing persistent inbox table keyed by recipient user. Existing specs currently describe bell as settings-only, so this change must update contracts and implementation together.

## Goals / Non-Goals

**Goals:**
- Persist notification inbox items per recipient user.
- Show unread badge and recent notifications directly in bell popover.
- Support item-level and bulk read actions with optimistic UX + server reconcile.
- Keep chat unread/thread logic out of bell.
- Preserve existing notification delivery behavior.

**Non-Goals:**
- Replacing chat inbox/thread surfaces.
- Real-time websocket subscription for inbox updates.
- Cross-device push delivery redesign.
- Full cursor-based pagination (initial implementation uses limit/offset).

## Decisions

### D1: Introduce dedicated `user_notification` table

Use a separate table keyed by `user_id` and `idempotency_key` instead of repurposing delivery jobs. Delivery jobs track channel execution; inbox rows track user-visible history and read state.

### D2: Write inbox rows at enqueue-time, not dispatch-time

Inbox entries are created when a notification event is enqueued for a recipient user. This keeps inbox availability decoupled from downstream channel delivery status and matches common in-app notification behavior.

### D3: Reuse shared notification content mapping

Leverage notification-delivery shared domain mapping for title/body/href derivation, so inbox copy and push copy remain consistent.

### D4: Keep bell as notification-domain only (not chat-domain)

Bell inbox displays notification events and unread counts from `user_notification` only. Chat unread remains in chat inbox/widget and is never computed from bell inbox data.

### D5: Optimistic unread UX with reconciliation

Bell mutations (`markAsRead`, `markAllAsRead`) optimistically update local UI and then invalidate/refetch unread/list queries to guarantee consistency.

## Risks / Trade-offs

- **[Risk] Duplicate inbox rows from repeated enqueue attempts** -> **Mitigation:** unique `idempotency_key` with `onConflictDoNothing`.
- **[Risk] Event payload mapping drift** -> **Mitigation:** reuse shared notification content resolver and add unit tests for representative event types.
- **[Risk] Bell popover complexity growth** -> **Mitigation:** extract inbox section into dedicated component and keep push-toggle section compact.
- **[Risk] Existing dirty workspace overlap** -> **Mitigation:** scope edits to notification-related files only and avoid unrelated modifications.

## Migration Plan

1. Add Drizzle schema for `user_notification` and export from schema index.
2. Generate/apply migration with `pnpm db:generate` then `pnpm db:migrate`.
3. Add backend module and tRPC router registration.
4. Wire notification delivery service to persist inbox rows per recipient.
5. Add frontend API/hooks/domain helpers and bell inbox UI.
6. Add/update tests and run lint.

Rollback: revert application code and migration if needed; table can remain unused safely if rollback is application-only.

## Open Questions

- None for implementation. Pagination and real-time push for inbox can be future enhancements.
