# Notification System (Booking)

## Scope
- Event: paid reservation created (status: CREATED)
- Behavior: enqueue notification jobs asynchronously (non-blocking)
- Delivery: cron dispatcher sends via Viber Bot API
- Channel: VIBER_BOT only (MVP)

## Constraints (Viber Bot API)
- Bot can only message a Viber `user_id` that has subscribed to the bot.
- The system stores Viber `user_id` targets, not phone numbers.

## Data Model

### booking_notifier
Org-level notification targets. This is the only table that maps organizations to recipients.

Columns (MVP):
- id (uuid)
- organizationId (uuid, FK -> organization.id)
- channel (enum: VIBER_BOT)
- target (string, Viber user_id)
- isActive (boolean)
- createdAt, updatedAt (timestamptz)

Indexes/constraints:
- unique (organizationId, channel, target)
- index (organizationId, channel, isActive)

### booking_notification_job (outbox)
Async delivery queue. Jobs are created within the reservation creation transaction.

Columns (MVP):
- id (uuid)
- reservationId (uuid, FK -> reservation.id)
- organizationId (uuid)
- channel (enum: VIBER_BOT)
- target (string, nullable for SKIPPED)
- eventType (string, e.g. "reservation.created.paid")
- status (enum: PENDING | SENDING | SENT | FAILED | SKIPPED)
- attemptCount (int)
- nextAttemptAt (timestamptz, nullable)
- lastError (text, nullable)
- sentAt (timestamptz, nullable)
- createdAt, updatedAt (timestamptz)
- idempotencyKey (text, unique)

Idempotency:
- send job key: reservation.created.paid:<reservationId>:viber:<target>
- skipped job key: reservation.created.paid:<reservationId>:viber:SKIPPED_NO_NOTIFIERS

## Write Path (Enqueue)

Only paid reservations enqueue jobs. The enqueue happens inside the paid reservation
use case transaction so that jobs exist only if the reservation is committed.

Chokepoint:
- src/modules/reservation/use-cases/create-paid-reservation.use-case.ts

Algorithm:
1. Create reservation, link slots, set slot status, insert reservation_event.
2. Resolve organizationId via reservation -> timeSlot -> court -> place.
3. If no organizationId, do nothing.
4. Load active booking_notifier targets for the org and VIBER_BOT.
5. If none, insert exactly one SKIPPED job with lastError = "NO_ACTIVE_NOTIFIERS".
6. Else, insert one PENDING job per target.

## Dispatch Path (Cron)

Cron route:
- src/app/api/cron/dispatch-booking-notifications/route.ts

Flow:
1. Verify CRON_SECRET.
2. Claim a batch of PENDING jobs (set to SENDING).
3. For each job:
   - Load reservation context for message rendering.
   - Send via strategy (VIBER_BOT).
   - Update job status to SENT or FAILED.
4. Retry transient failures using nextAttemptAt + attemptCount.

Suggested retry policy:
- Max attempts: 5
- Backoff: 1m, 5m, 15m, 60m, 6h
- Non-retryable: bad auth, known "not subscribed" error

## Message Content

Use place.timeZone for all date/time formatting. Include:
- Place name + court label
- Date + time range
- Player snapshot (name, phone/email)
- Total price + currency
- expiresAt (owner review deadline)
- Reservation ID

Formatting helpers:
- src/shared/lib/format.ts

## Environment Variables

- VIBER_BOT_AUTH_TOKEN
- VIBER_BOT_SENDER_NAME

## Future Extensions

- Viber webhook to capture sender.id and automate org linking
- Additional channels (SMS/email/WhatsApp) via new strategies
- Owner-config UI for managing booking_notifier targets
