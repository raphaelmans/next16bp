# Notification Event Catalog (All Business Types)

This page is the workshop source of truth for all current business notification types.

## Event catalog

| Event type | Business trigger | Recipient role | Channels | Where user sees it | Delivery behavior |
| --- | --- | --- | --- | --- | --- |
| `place_verification.requested` | Owner submits a venue verification request | Admin | Email, SMS, Web Push, Mobile Push | Email inbox, SMS inbox, browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `reservation.created` | Player creates a reservation | Owner | Email, SMS, Web Push, Mobile Push | Email inbox, SMS inbox, browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `place_verification.approved` | Admin approves verification | Owner | Email, SMS, Web Push, Mobile Push | Email inbox, SMS inbox, browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `place_verification.rejected` | Admin rejects verification | Owner | Email, SMS, Web Push, Mobile Push | Email inbox, SMS inbox, browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `claim_request.approved` | Admin approves claim request | Owner | Email, SMS, Web Push, Mobile Push | Email inbox, SMS inbox, browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `claim_request.rejected` | Admin rejects claim request | Owner | Email, SMS, Web Push, Mobile Push | Email inbox, SMS inbox, browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `reservation.awaiting_payment` | Owner accepts reservation and payment is needed | Player | Web Push, Mobile Push | Browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `reservation.payment_marked` | Player marks payment completed | Owner | Web Push, Mobile Push | Browser notification, mobile notification tray | Best-effort enqueue (warning log on enqueue failure) + async dispatch/retries |
| `reservation.confirmed` | Owner confirms reservation | Player | Web Push, Mobile Push | Browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `reservation.rejected` | Owner rejects reservation | Player | Web Push, Mobile Push | Browser notification, mobile notification tray | Transaction-coupled enqueue + async dispatch/retries |
| `reservation.cancelled` | Player cancels reservation | Owner | Web Push, Mobile Push | Browser notification, mobile notification tray | Best-effort enqueue (warning log on enqueue failure) + async dispatch/retries |

## Scope notes

- This catalog intentionally excludes testing-only events.
- Chat notifications are documented separately in [notification-overview-all-channels.md](./notification-overview-all-channels.md) because they are real-time chat signals, not outbox-delivery jobs.
- Channel delivery still depends on runtime availability and settings (for example: missing contact details, missing push subscription, or channel toggle disabled).

## Source references

- Enqueue logic: `src/lib/modules/notification-delivery/services/notification-delivery.service.ts`
- Recipients: `src/lib/modules/notification-delivery/repositories/notification-recipient.repository.ts`
- Dispatch and retries: `src/app/api/cron/dispatch-notification-delivery/route.ts`
