# Deferred Work (Notification System)

Items explicitly out of scope for the initial Email+SMS MVP.

## Deferred Features

| Feature | Priority | Reason Deferred |
|---------|----------|-----------------|
| In-app notification inbox (read/unread) | Medium | Needs product UX + RLS + UI surfaces |
| User notification preferences UI (per event/channel) | Medium | Requires schema + settings UI |
| Web push notifications | Low | Requires service worker + VAPID + permission UX |
| Reservation lifecycle notifications (owner/player) | High | Add after MVP admin verification notification is stable |
| Dead-letter queue + admin dashboard for failed jobs | Medium | Operational UI not needed for MVP |

## When to Revisit

- After admin verification notifications are stable in production
- When owner reservation inbox becomes the primary operational channel
