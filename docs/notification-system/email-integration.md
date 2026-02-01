# Email Integration (Resend)

## Overview
Email delivery uses the existing Resend integration.

## Implementation
- Strategy interface: `src/lib/shared/infra/email/email-service.ts`
- Provider: `src/lib/shared/infra/email/resend-email.service.ts`
- Factory: `src/lib/shared/infra/email/email.factory.ts`

## Idempotency
Use Resend idempotency headers to prevent duplicates:
- `Idempotency-Key: <notification_delivery_job.idempotencyKey>`

## Environment variables
- `RESEND_API_KEY`
- `CONTACT_US_FROM_EMAIL` (used as sender in MVP)
