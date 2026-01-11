# Reservation State Machine — Level 3 Automation & Ops

## Cron schedule
- Vercel cron runs every minute (`* * * * *`).
- Endpoint: `/api/cron/expire-reservations`.

## Owner monitoring (UI)
- Owner “Active Reservations” queue includes:
  - `AWAITING_PAYMENT` (TTL countdown shown)
  - `PAYMENT_MARKED_BY_USER` (only when owner confirmation is required)
- Owner UI polls every 15 seconds for fresh data:
  - Floating alerts panel and `/owner/reservations/active`.
- Owner can deep-link to a reservation detail page:
  - `/owner/reservations/[id]` (query supports `reservationId` filter).

## Expiration logic
- Filter: `expiresAt < now` and status in `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`.
- `expiresAt` is set from **court-specific policy values**:
  - Payment window (`paymentHoldMinutes`) on creation
  - Owner review window (`ownerReviewMinutes`) after payment is marked
- Transaction updates:
  - Reservation → `EXPIRED`.
  - Time slot → `AVAILABLE`.
  - Audit event → `SYSTEM` role with timeout note.

## Cancellation behavior
- Player cancellation is allowed across all non-terminal states but blocked after the court’s cutoff window.
- Cutoff is computed from the slot start time minus `cancellationCutoffMinutes`.

## Security
- Optional `CRON_SECRET` gate using `Authorization: Bearer <secret>`.
- When `CRON_SECRET` is set, requests without it return 401.

## Logging
- Cron emits success/failure logs with `[CRON]` prefix.
- Per-reservation errors are captured but do not abort the batch.

## Implementation references
- `agent-contexts/00-06-feature-implementation-status.md`
- `agent-contexts/00-01-kudoscourts-server.md`
- `agent-contexts/00-13-owner-reservation-ops.md`
- `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts`
- `src/modules/reservation/services/reservation.service.ts`
- `src/modules/reservation/services/reservation-owner.service.ts`
- `src/modules/time-slot/repositories/time-slot.repository.ts`
- `src/modules/reservation/dtos/reservation-owner.dto.ts`
- `src/modules/reservation/repositories/reservation.repository.ts`
- `src/app/api/cron/expire-reservations/route.ts`
- `src/app/(owner)/owner/reservations/active/page.tsx`
- `src/app/(owner)/owner/reservations/[id]/page.tsx`
- `src/features/owner/components/reservation-alerts-panel.tsx`
- `src/features/owner/components/slot-item.tsx`
- `src/shared/infra/db/schema/enums.ts`
