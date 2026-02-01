# Developer 1 Checklist (Server) - Notification System

**Focus Area:** DB outbox + delivery cron + vendor adapters

## Module 1A: Outbox schema

- [ ] Add enums for delivery channel + job status
- [ ] Add `notification_delivery_job` table
- [ ] Add indexes + unique `idempotencyKey`
- [ ] Generate + apply migrations

## Module 1B: SMS adapter (Semaphore)

- [ ] Add `SmsServiceStrategy` interface
- [ ] Implement `SemaphoreSmsService`
- [ ] Add factory + env validation
- [ ] Normalize phone numbers via `normalizePhMobile`

## Module 2A: Cron dispatcher

- [ ] Add `/api/cron/dispatch-notification-delivery` route
- [ ] Implement safe batch-claim (prefer SKIP LOCKED via raw SQL)
- [ ] Implement retry policy + status transitions
- [ ] Wire Resend + Semaphore senders
- [ ] Update `vercel.json` cron schedule

## Module 3A: Place verification submit -> admin enqueue

- [ ] Add admin recipient query (user_roles + profile)
- [ ] Enqueue EMAIL/SMS jobs inside submit transaction
- [ ] Define idempotency keys

## Validation

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
