# [00-15] Court Reservation Policies

> Date: 2026-01-11
> Previous: 00-13-owner-reservation-ops.md

## Summary

Implemented **per-court reservation policies** (TTL windows, optional owner confirmation for paid reservations, and cancellation cutoff) and wired them end-to-end across backend enforcement, owner court configuration UI, and player booking/reservation screens. Updated reservation state machine documentation to reflect the new policy-driven behavior.

## Changes Made

### Database & Migrations

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/court.ts` | Extended `reservable_court_detail` with `requiresOwnerConfirmation`, `paymentHoldMinutes`, `ownerReviewMinutes`, `cancellationCutoffMinutes`. |
| `drizzle/0001_reservation_policies.sql` | Added SQL migration to create new policy columns with safe defaults. |
| `drizzle/meta/_journal.json` | Registered migration tag `0001_reservation_policies`. |
| `drizzle/meta/0000_snapshot.json` | Updated Drizzle snapshot metadata for `reservable_court_detail`. |

### Backend (Reservation Enforcement)

| File | Change |
|------|--------|
| `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts` | Made paid TTL configurable via `paymentHoldMinutes` (defaults to 15). |
| `src/modules/reservation/services/reservation.service.ts` | Applied court policy for payment window and owner review; added auto-confirm path when owner confirmation is disabled; enforced cancellation across all non-terminal states with cutoff. |
| `src/modules/reservation/errors/reservation.errors.ts` | Added `ReservationCancellationWindowError` for cutoff enforcement failures. |
| `src/modules/reservation/reservation.router.ts` | Mapped cancellation cutoff errors to `BAD_REQUEST`. |

### Backend (Court DTOs)

| File | Change |
|------|--------|
| `src/modules/court/dtos/create-court.dto.ts` | Accepted reservation policy fields for reservable court creation. |
| `src/modules/court/dtos/update-court.dto.ts` | Accepted reservation policy fields in `UpdateReservableCourtDetailSchema`. |
| `src/modules/court/use-cases/create-reservable-court.use-case.ts` | Persisted policy fields when creating reservable court details. |
| `src/modules/court/use-cases/create-simple-court.use-case.ts` | Seeded defaults for policies during simplified court creation. |

### Owner UI (Court Configuration)

| File | Change |
|------|--------|
| `src/features/owner/schemas/court-form.schema.ts` | Added policy fields to form schema and defaults. |
| `src/features/owner/components/court-form.tsx` | Added "Reservation Policies" section to the payment step (toggle + minutes inputs). |
| `src/features/owner/hooks/use-court-form.ts` | Passed policy fields through `courtManagement.createReservable` and `courtManagement.updateDetail`. |
| `src/app/(owner)/owner/courts/[id]/edit/page.tsx` | Hydrated default policy values from reservable court detail. |

### Player UX (Booking + Reservation Detail)

| File | Change |
|------|--------|
| `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Displayed reservation policy summary and used `paymentHoldMinutes` for payment info timing. |
| `src/features/discovery/hooks/use-court-detail.ts` | Surfaced policy fields from court detail for downstream UI use. |
| `src/app/(auth)/reservations/[id]/page.tsx` | Calculated cancellation availability and cutoff messaging based on court policy. |
| `src/features/reservation/components/reservation-actions-card.tsx` | Added support for disabling cancel with a reason string. |
| `src/features/reservation/hooks/use-cancel-reservation.ts` | Connected cancel action to `trpc.reservation.cancel`. |
| `src/features/reservation/hooks/use-mark-payment.ts` | Adjusted success messaging for auto-confirm vs owner-review cases. |

### Multi-Court Owner Usability (Reservation Ops Filter)

| File | Change |
|------|--------|
| `src/features/owner/hooks/use-owner-court-filter.ts` | Added shared court filter state via `courtId` query param + local storage. |
| `src/features/owner/components/reservation-alerts-panel.tsx` | Added court filter dropdown and preserved filter in navigation to active queue. |
| `src/app/(owner)/owner/reservations/page.tsx` | Reused shared court filter for multi-court owners. |
| `src/app/(owner)/owner/reservations/active/page.tsx` | Added court dropdown and filtered active queue by `courtId`. |

### Documentation

| File | Change |
|------|--------|
| `docs/reservation-state-machine.md` | Updated "What changed" to reference court-specific policies and cancellation rules. |
| `docs/reservation-state-machine-level-0-summary.md` | Updated summary for policy-driven TTL + cancellation. |
| `docs/reservation-state-machine-level-1-product.md` | Updated product narrative and flow to include court-specific windows and optional owner confirmation. |
| `docs/reservation-state-machine-level-2-engineering.md` | Updated state transitions and TTL semantics (payment window + owner review window). |
| `docs/reservation-state-machine-level-3-ops.md` | Updated ops notes for policy-driven `expiresAt` and cancellation cutoff behavior. |

## Key Decisions

- Implemented **owner confirmation toggle for paid reservations only** (free bookings remain immediate confirmation).
- Shifted TTL semantics to **two court-specific windows**:
  - `paymentHoldMinutes` from creation (`AWAITING_PAYMENT`)
  - `ownerReviewMinutes` after `markPayment` when owner confirmation is required
- Allowed **player cancellation across all non-terminal states** with a per-court cutoff, enforced server-side and surfaced in UI.

## Next Steps (if applicable)

- [ ] Decide if free courts should optionally require owner confirmation (would require a new reservation status).
- [ ] Run `pnpm db:migrate` in the target environment to apply `0001_reservation_policies`.

## Commands to Continue

```bash
pnpm lint
pnpm build
pnpm db:migrate
```
