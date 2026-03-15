# Reservation Chat - User Stories

## Overview

Reservation chat lets players and venue owners message each other in the context of a specific reservation.

These stories are derived from the current, shipped chat behavior.

- System-generated reservation chat messages are seeded for key lifecycle transitions:
  - reservation request submitted
  - player payment submitted
  - owner confirmation
- Seeded system messages are idempotent and should appear once per reservation transition.

This domain is closely related to the notification system:

- The platform supports async notifications via an outbox + cron dispatcher (email/SMS/Web Push).
- Browser notifications (Web Push) require explicit per-device opt-in by the user (browser permission + subscription).
- A bell entry point is available in the Owner + Player headers to enable/disable browser notifications quickly; settings pages also include a full enable/disable card.
- Chat message push notifications are still deferred until Stream webhook ingestion is implemented (see deferred stories). For now, Web Push is used for reservation lifecycle events and other system notifications.

---

## References

| Document | Path |
|---|---|
| Project context | `agent-plans/context.md` |
| Chat implementation plan (historical) | `.opencode/plans/1770130108504-jolly-island.md` |
| Chat support diagram (current) | `agent-plans/user-stories/67-reservation-chat/67-10-chat-support-diagram.md` |
| Notification system plan | `agent-plans/81-notification-system/81-00-overview.md` |
| Notification system docs | `docs/notification-system/` |
| Notification delivery agent context | `agent-contexts/01-44-notification-delivery.md` |
| Web Push agent context | `agent-contexts/01-58-web-push-notifications.md` |
| Reservation state machine diagram | `docs/reservation-state-machine-diagram.md` |

### Notification opt-in UI (implementation context)

- Owner header bell: `src/features/owner/components/owner-navbar.tsx`
- Player header bell: `src/components/layout/player-navbar.tsx`
- Bell component: `src/features/notifications/components/notification-bell.tsx`
- Web Push enable/disable card: `src/features/notifications/components/web-push-settings.tsx`
- Player profile settings page: `src/app/(auth)/account/profile/page.tsx`
- Owner settings page: `src/app/(owner)/owner/settings/page.tsx`
- Admin notification test page: `src/app/(admin)/admin/tools/notification-test/page.tsx`
- Shared Web Push hook: `src/features/notifications/hooks/use-web-push.ts`
- Service worker: `public/sw.js`

---

## Story Index

| ID | Story | Status | Supersedes |
|---|---|---|---|
| US-67-01 | Player Messages Venue From Reservation | Active | - |
| US-67-02 | Owner Uses Inbox To Reply Across Reservations | Active | - |
| US-67-03 | Admin Captures Reservation Chat Transcript Snapshot | Active | - |
| US-67-04 | Player Uses Global Chat Widget On /reservations | Active | - |

---

## Summary

- Total: 4
- Active: 4
- Superseded: 0
