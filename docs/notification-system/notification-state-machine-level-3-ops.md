# Notification State Machine - Level 3 Automation & Ops

## Cron schedule
- Vercel cron runs every minute (`* * * * *`).
- Endpoint: `/api/cron/dispatch-notification-delivery`

## Security
- `CRON_SECRET` gate (Authorization: `Bearer <secret>`).
- Requests with invalid/missing bearer token return 401 when `CRON_SECRET` is configured.
- In non-dev/test environments, missing `CRON_SECRET` configuration returns 500.

## Retry policy
- Max attempts: 5
- Backoff: 1m, 5m, 15m, 60m, 6h
- After max attempts, jobs remain `FAILED` and are not re-claimed.

## Rate limits (Semaphore)
- `/messages`: 120 requests per minute
- `/priority`: not rate limited (2 credits per 160 chars)
- App-level retry scheduling is handled by notification job backoff (`1m, 5m, 15m, 60m, 6h`)

## Logging
- `notification_delivery.dispatch_complete`
- `notification_delivery.failed`
- `notification_delivery.jobs_enqueued`

## Environment variables
- `RESEND_API_KEY`
- `CONTACT_US_FROM_EMAIL` (used as sender)
- `SEMAPHORE_API_KEY`
- `SEMAPHORE_SENDER_NAME` (optional)
- `SEMAPHORE_BASE_URL` (optional)
- `NEXT_PUBLIC_APP_URL` (optional; used for deep links)
- `CRON_SECRET`

Web Push:
- `NOTIFICATION_WEB_PUSH_ENABLED` (default: true; see Channel toggles)
- `WEB_PUSH_VAPID_PUBLIC_KEY`
- `WEB_PUSH_VAPID_PRIVATE_KEY`
- `WEB_PUSH_VAPID_SUBJECT`

Mobile Push (Expo):
- `NOTIFICATION_MOBILE_PUSH_ENABLED` (default: true; see Channel toggles)
- `EXPO_PUSH_ACCESS_TOKEN` (optional; required only when Expo enhanced push security is enabled)

## Channel toggles

- `NOTIFICATION_EMAIL_ENABLED` (default: true)
  - Set to `false` to permanently skip EMAIL jobs (marked `SKIPPED` with `DISABLED_CHANNEL:EMAIL`).
- `NOTIFICATION_SMS_ENABLED` (default: true)
  - Set to `false` to permanently skip SMS jobs (marked `SKIPPED` with `DISABLED_CHANNEL:SMS`).

- `NOTIFICATION_WEB_PUSH_ENABLED` (default: true)
  - Set to `false` to permanently skip WEB_PUSH jobs (marked `SKIPPED` with `DISABLED_CHANNEL:WEB_PUSH`).

- `NOTIFICATION_MOBILE_PUSH_ENABLED` (default: true)
  - Set to `false` to permanently skip MOBILE_PUSH jobs (marked `SKIPPED` with `DISABLED_CHANNEL:MOBILE_PUSH`).

Notes:
- When a channel is disabled, enqueue will stop creating jobs for that channel.
- If jobs already exist in the outbox, the dispatcher will mark them `SKIPPED` when it encounters them.
