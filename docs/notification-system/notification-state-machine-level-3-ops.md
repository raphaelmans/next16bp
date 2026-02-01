# Notification State Machine - Level 3 Automation & Ops

## Cron schedule
- Vercel cron runs every minute (`* * * * *`).
- Endpoint: `/api/cron/dispatch-notification-delivery`

## Security
- `CRON_SECRET` gate (Authorization: `Bearer <secret>`).
- Requests without valid secret return 401.

## Retry policy
- Max attempts: 5
- Backoff: 1m, 5m, 15m, 60m, 6h
- After max attempts, jobs remain `FAILED` and are not re-claimed.

## Rate limits (Semaphore)
- `/messages`: 120 requests per minute
- `/priority`: not rate limited (2 credits per 160 chars)
- Respect `Retry-After` when provided

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
