# Phase 1: Server Foundation (Outbox + Providers)

**Dependencies:** none
**Parallelizable:** Yes (DB schema can proceed while provider adapter is built)

## Objective

Create the foundational primitives for async notification delivery:
- DB schema for jobs (outbox)
- Strategy/adapter layer for SMS Semaphore
- Small helper/service surface for enqueueing jobs from domain services

## Module 1A: DB Schema (Outbox)

### Schema additions

Add enums in `src/lib/shared/infra/db/schema/enums.ts`:
- `notification_delivery_channel`: `EMAIL | SMS`
- `notification_delivery_job_status`: `PENDING | SENDING | SENT | FAILED | SKIPPED`

Add job table in `src/lib/shared/infra/db/schema/notification-delivery-job.ts`:

Columns (MVP):
- `id` (uuid)
- `channel` (enum)
- `eventType` (text) e.g. `place_verification.requested`
- `target` (text, nullable) email or phone; nullable for `SKIPPED`
- `organizationId` (uuid, nullable)
- `reservationId` (uuid, nullable)
- `placeVerificationRequestId` (uuid, nullable)
- `payload` (jsonb, nullable) (safe redacted context for rendering)
- `status` (enum)
- `attemptCount` (int)
- `nextAttemptAt` (timestamptz, nullable)
- `lastError` (text, nullable)
- `providerMessageId` (text, nullable) (Resend id / Semaphore message_id)
- `sentAt` (timestamptz, nullable)
- `createdAt`, `updatedAt` (timestamptz)
- `idempotencyKey` (text, unique)

Indexes:
- `(status, nextAttemptAt)` for dispatcher
- `(eventType, createdAt)` for debugging

Idempotency key convention:
- `place_verification.requested:<requestId>:admin:<adminUserId>:<channel>`

### Migration

- Run `pnpm db:generate`
- Run `pnpm db:migrate`

## Module 1B: Provider Adapters (Strategy Pattern)

### Email

Use existing:
- `src/lib/shared/infra/email/email-service.ts` (`EmailServiceStrategy`)
- `src/lib/shared/infra/email/email.factory.ts` (`makeEmailService()`)

### SMS (Semaphore)

Add a mirrored pattern:

Directory:
```text
src/lib/shared/infra/sms/
  sms-service.ts
  semaphore-sms.service.ts
  sms.factory.ts
```

`SmsServiceStrategy` (port) should support:
- `sendSms({ to, message, senderName?, priority? }): Promise<{ providerMessageId?: string }>`

`SemaphoreSmsService` (adapter) implements:
- Regular: `POST https://api.semaphore.co/api/v4/messages`
- Priority: `POST https://api.semaphore.co/api/v4/priority`
- `application/x-www-form-urlencoded`
- Parse JSON response array; capture `message_id` for auditing.
- Respect rate limiting headers when present.

Phone normalization:
- Use `normalizePhMobile()` from `src/common/phone.ts`.

Env (server-only) in `src/lib/env/index.ts`:
- `SEMAPHORE_API_KEY` (required to send)
- `SEMAPHORE_SENDER_NAME` (optional)
- `SEMAPHORE_BASE_URL` (optional; default `https://api.semaphore.co/api/v4`)

Gotcha (Semaphore docs): messages starting with `TEST` are silently ignored.

## Module 1C: Enqueue API (Minimal Service)

Create a small internal service or helper for enqueueing jobs:

Suggested module:
```text
src/lib/modules/notification-delivery/
  services/notification-delivery.service.ts
  repositories/notification-delivery-job.repository.ts
  factories/notification-delivery.factory.ts
```

Responsibilities:
- `enqueueJobs(...)` (insert many jobs with idempotency keys)
- centralize retry defaults: `attemptCount=0`, `status=PENDING`
- allow callers to pass `ctx` so enqueue happens inside existing transactions

No UI/tRPC endpoints in MVP.

## Testing Checklist

- [ ] Migration applies cleanly
- [ ] TypeScript builds
- [ ] A fake call to the Semaphore adapter can be stubbed (do not send real SMS in tests)
