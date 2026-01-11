# Reservation State Machine — Level 3 Automation & Ops

## Cron schedule
- Vercel cron runs every minute (`* * * * *`).
- Endpoint: `/api/cron/expire-reservations`.

## Expiration logic
- Filter: `expiresAt < now` and status in `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`.
- Transaction updates:
  - Reservation → `EXPIRED`.
  - Time slot → `AVAILABLE`.
  - Audit event → `SYSTEM` role with timeout note.

## Security
- Optional `CRON_SECRET` gate using `Authorization: Bearer <secret>`.
- When `CRON_SECRET` is set, requests without it return 401.

## Logging
- Cron emits success/failure logs with `[CRON]` prefix.
- Per-reservation errors are captured but do not abort the batch.

## Implementation references
- `agent-contexts/00-06-feature-implementation-status.md`
- `agent-contexts/00-01-kudoscourts-server.md`
- `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts`
- `src/modules/reservation/services/reservation.service.ts`
- `src/modules/reservation/services/reservation-owner.service.ts`
- `src/app/api/cron/expire-reservations/route.ts`
- `src/shared/infra/db/schema/enums.ts`
