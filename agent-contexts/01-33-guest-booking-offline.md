# [01-33] Guest Booking + Offline Confirm

> Date: 2026-01-29
> Previous: 01-32-public-venue-court-proxy-rewrite.md

## Summary

Implemented guest bookings with reusable guest profiles, offline payment confirmation, and updated reservation TTL defaults. Added owner UI for guest booking creation, offline confirm, and reservation overlays in the Availability Studio, plus state machine docs updates.

## Changes Made

### Database + Migrations

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/guest-profile.ts` | Added `guest_profile` table (org-scoped guest identities) with delete restrict. |
| `src/shared/infra/db/schema/reservation.ts` | `player_id` nullable, added `guest_profile_id` with restrict FK, identity CHECK constraint. |
| `src/shared/infra/db/schema/organization-payment.ts` | Default TTLs updated to 45 minutes. |
| `drizzle/0012_guest_profile_and_reservation_identity.sql` | Guest profile + reservation identity migration. |
| `drizzle/0013_update_default_ttls_to_45m.sql` | TTL default migration (new orgs only). |

### Backend (tRPC + Services)

| File | Change |
|------|--------|
| `src/modules/guest-profile/*` | New module (repo/service/factory/router/dtos/errors). |
| `src/shared/infra/trpc/root.ts` | Added `guestProfile` router. |
| `src/modules/reservation/dtos/reservation-owner.dto.ts` | Added `CreateGuestBookingSchema`, `ConfirmPaidOfflineSchema`, `GetActiveForCourtRangeSchema`. |
| `src/modules/reservation/reservation-owner.router.ts` | Added `createGuestBooking`, `confirmPaidOffline`, `getActiveForCourtRange`. |
| `src/modules/reservation/services/reservation-owner.service.ts` | Guest booking creation, offline confirm (creates payment_proof), active reservations range query. Added validation for time range/duration/pricing and offline confirm guard. |
| `src/modules/reservation/errors/reservation.errors.ts` | Added payment-not-required error; expanded validation errors. |
| `src/modules/reservation/factories/reservation.factory.ts` | Wired guest profile + payment proof deps. |
| `src/modules/reservation/services/reservation.service.ts` | Owner review default set to 45m. |

### Owner UI

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Guest booking dialog + selection/creation (StandardFormSelect) and actions. |
| `src/app/(owner)/owner/reservations/page.tsx` | Added "Confirm paid offline" dialog with required payment reference. |
| `src/features/owner/components/reservations-table.tsx` | Added "Paid offline" CTA for CREATED paid reservations. |
| `src/app/(owner)/owner/bookings/page.tsx` | Guest booking preset, dialog, and reservation overlay in timeline (day/week). |

### Documentation

| File | Change |
|------|--------|
| `docs/reservation-state-machine*.md` | Added guest + offline confirm paths, identity invariant, TTLs updated to 45m. |

## Key Decisions

- `CONFIRMED` does not mean free; paid offline confirmations keep `totalPriceCents` and record a `payment_proof` reference.
- Guest profiles are org-scoped with delete restrict to preserve reservation identity invariants.
- Default TTLs are 45 minutes for new orgs only (no data migration for existing policy rows).

## Next Steps (if applicable)

- [ ] Optional: implement draft/resizable guest booking flow in Availability Studio (beyond current dialog-on-drop).

## Commands to Continue

```bash
pnpm lint
pnpm build
```
