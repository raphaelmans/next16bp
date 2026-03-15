# [01-58] Web Push Notifications

> Date: 2026-02-05
> Previous: 01-57-agent-context-checkpoint.md

## Summary

Implemented the web push notification system end-to-end, covering database migrations, web-push infrastructure, subscription management, scheduled dispatching, owner settings UI, and documentation updates.

## Changes Made

### Database

| File | Change |
| --- | --- |
| `drizzle/0021_notification_delivery_outbox.sql` | Added notification delivery outbox migration. |
| `drizzle/0022_web_push_notifications.sql` | Added web push notification tables and constraints. |
| `src/lib/shared/infra/db/schema/enums.ts` | Added notification-related enums. |
| `src/lib/shared/infra/db/schema/index.ts` | Exported new notification and push subscription schema. |
| `src/lib/shared/infra/db/schema/push-subscription.ts` | Added push subscription schema. |

### Backend

| File | Change |
| --- | --- |
| `src/lib/shared/infra/web-push/` | Implemented web-push adapter and helpers. |
| `src/lib/modules/push-subscription/` | Added push subscription module (repository/service/router). |
| `src/lib/modules/notification-delivery/factories/notification-delivery.factory.ts` | Wired notification delivery factory updates. |
| `src/lib/modules/notification-delivery/repositories/notification-recipient.repository.ts` | Added recipient lookup for delivery. |
| `src/lib/modules/notification-delivery/services/notification-delivery.service.ts` | Implemented delivery orchestration. |
| `src/lib/modules/reservation/factories/reservation.factory.ts` | Integrated reservation hooks for notifications. |
| `src/lib/modules/reservation/services/reservation-owner.service.ts` | Added owner-facing notification triggers. |
| `src/lib/modules/reservation/services/reservation.service.ts` | Added notification dispatch for reservation events. |
| `src/lib/shared/infra/trpc/root.ts` | Registered push subscription router. |
| `src/lib/env/index.ts` | Added web-push environment vars. |

### API + Cron

| File | Change |
| --- | --- |
| `src/app/api/cron/dispatch-notification-delivery/route.ts` | Added cron route to dispatch queued notifications. |

### Frontend

| File | Change |
| --- | --- |
| `src/features/notifications/` | Added UI and hooks for push subscription flow. |
| `src/app/(owner)/owner/settings/page.tsx` | Added owner notification settings UI. |
| `public/sw.js` | Added service worker for web push. |

### Documentation

| File | Change |
| --- | --- |
| `.env.example` | Added web-push env vars and documentation references. |
| `docs/notification-system/README.md` | Documented architecture and setup. |
| `docs/notification-system/notification-state-machine.md` | Updated state machine diagrams. |
| `docs/notification-system/notification-state-machine-ascii.md` | Updated ASCII state machine. |
| `docs/notification-system/notification-state-machine-level-0-summary.md` | Updated summary view. |
| `docs/notification-system/notification-state-machine-level-1-product.md` | Updated product-level flow. |
| `docs/notification-system/notification-state-machine-level-2-engineering.md` | Updated engineering-level flow. |
| `docs/notification-system/notification-state-machine-level-3-ops.md` | Updated ops-level flow. |

## Key Decisions

- Used an outbox-style delivery queue with cron dispatch to decouple event creation from delivery.
- Centralized web-push configuration and delivery in a shared adapter to keep services slim.
- Added owner settings UI to gate subscription and notification preferences.

## Next Steps (if applicable)

- [ ] Verify cron schedule and delivery throughput in staging.
- [ ] Confirm browser permission prompts and subscription renewal UX.

## Commands to Continue

```bash
pnpm lint
```
