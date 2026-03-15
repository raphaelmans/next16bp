# Phase 2-3: Server Dispatcher + MVP Wiring (Admin Verification Notifications)

**Dependencies:** Phase 1
**Parallelizable:** Partial (dispatcher can be built while wiring enqueue is prepped)

## Objective

1) Add a cron dispatcher that reliably delivers outbox jobs via:
- Resend (email)
- Semaphore (sms)

2) Wire the MVP producer:
- `place_verification.requested` -> admins are notified.

## Module 2A: Cron Dispatcher

### Route

Add:
- `src/app/api/cron/dispatch-notification-delivery/route.ts`

Security:
- Require `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set (match `expire-reservations`).

Schedule:
- Update `vercel.json` to add a cron entry (start with every minute).

### Claim algorithm

Goal: claim N jobs without double-sending.

Preferred (Postgres):
- `UPDATE ... WHERE id IN (SELECT id ... FOR UPDATE SKIP LOCKED LIMIT N) RETURNING *`

If Drizzle cannot express this cleanly, use `sql` tagged raw SQL in a transaction.

### Retry policy

- Max attempts: 5
- Backoff: 1m, 5m, 15m, 60m, 6h
- Non-retryable:
  - 4xx validation errors from vendors (bad target, missing api key)
  - known Semaphore "not allowed" errors

Store:
- `attemptCount`, `nextAttemptAt`, `lastError`, `providerMessageId`, `sentAt`

### Delivery rules

- EMAIL:
  - Use Resend via `makeEmailService().sendEmail(...)`
  - Set headers: `Idempotency-Key: <idempotencyKey>`
- SMS:
  - Use Semaphore adapter
  - Normalize phone
  - Avoid message prefix `TEST`

## Module 3A: Enqueue on Place Verification Submit (Admin Notification)

### Chokepoint

Inside the existing transaction in:
- `src/lib/modules/place-verification/services/place-verification.service.ts`

After:
- `place_verification_request` creation
- `place_verification_request_event` creation (`null -> PENDING`)

### Recipient resolution

- Admin list: `user_roles.role = "admin"`.
- Join to `profile` by `profile.userId = user_roles.userId` to get:
  - email
  - phoneNumber

### Jobs to enqueue

For each admin:
- EMAIL job if email exists
- SMS job if phoneNumber exists

Event type:
- `place_verification.requested`

Payload:
- `requestId`, `placeId`, `organizationId`
- optional `placeName` (if already available) or resolve at send-time.

Deep link:
- `/admin/verification/<requestId>`

## Testing Checklist

- [ ] Cron route responds 401 without CRON_SECRET
- [ ] Claiming is concurrency-safe (two parallel calls do not send same job)
- [ ] Jobs retry on transient failures
- [ ] Admin receives at least one channel when contact info exists
