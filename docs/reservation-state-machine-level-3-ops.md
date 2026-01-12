# Reservation State Machine — Level 3 Automation & Ops

This level describes the operational behavior expected from background jobs and owner monitoring.

## Cron schedule
- Vercel cron runs every minute (`* * * * *`).
- Endpoint: `/api/cron/expire-reservations`.

## Expiration logic (desired contract)
- Filter: `expiresAt < now` and status in:
  - `CREATED`
  - `AWAITING_PAYMENT`
  - `PAYMENT_MARKED_BY_USER`
- Transaction updates:
  - Reservation → `EXPIRED`.
  - Time slot → `AVAILABLE`.
  - Audit event → `SYSTEM` role with timeout note.

## Owner monitoring (UI)
- Owner “Active Reservations” queue should include:
  - `CREATED` (awaiting acceptance)
  - `AWAITING_PAYMENT` (countdown)
  - `PAYMENT_MARKED_BY_USER`
- Polling cadence: every 15 seconds for fresh data.
- Deep links:
  - `/owner/reservations/active`
  - `/owner/reservations/[id]`

## Security
- Optional `CRON_SECRET` gate using `Authorization: Bearer <secret>`.
- When `CRON_SECRET` is set, requests without it return 401.

## References
- `agent-contexts/00-13-owner-reservation-ops.md`
- `src/app/api/cron/expire-reservations/route.ts`
