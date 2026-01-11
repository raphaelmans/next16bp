# [00-12] Court Management Wizard

> Date: 2026-01-11
> Previous: 00-11-auth-routing-refactor.md

## Summary

Added owner court setup wizard and edit flow, introduced default court pricing with slot fallback, and documented new user stories plus implementation plans for court management and booking price accuracy.

## Changes Made

### Documentation

| File | Change |
|------|--------|
| `agent-plans/user-stories/02-court-creation/02-05-owner-creates-court-wizard.md` | Added wizard story for multi-step court setup using nuqs. |
| `agent-plans/user-stories/02-court-creation/02-06-owner-edits-court-details.md` | Added edit story covering pricing and payment updates. |
| `agent-plans/user-stories/06-court-reservation/06-03-player-sees-correct-pricing.md` | Added player pricing visibility story. |
| `agent-plans/user-stories/02-court-creation/02-00-overview.md` | Updated story index and summary totals. |
| `agent-plans/user-stories/06-court-reservation/06-00-overview.md` | Added pricing story to index and totals. |
| `agent-plans/12-court-management/12-00-overview.md` | Created master implementation plan. |
| `agent-plans/12-court-management/12-01-backend-pricing-foundation.md` | Defined pricing foundation phase. |
| `agent-plans/12-court-management/12-02-owner-wizard-edit.md` | Defined owner wizard/edit phase. |
| `agent-plans/12-court-management/12-03-player-pricing-display.md` | Defined booking price visibility phase. |
| `agent-plans/12-court-management/court-management-dev1-checklist.md` | Added developer checklist for backend work. |

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/court-form.tsx` | Replaced tabs with nuqs-driven wizard steps and gating. |
| `src/features/owner/hooks/use-court-form.ts` | Switched creation to `createReservable`, added edit updates for details + amenities. |
| `src/app/(owner)/owner/courts/[id]/edit/page.tsx` | Added owner edit page with prefilled defaults. |
| `src/shared/infra/db/schema/court.ts` | Added `default_price_cents` column for reservable courts. |
| `src/modules/court/dtos/create-court.dto.ts` | Added `defaultPriceCents` to create DTO. |
| `src/modules/court/dtos/create-simple-court.dto.ts` | Added `defaultPriceCents` to simple create DTO. |
| `src/modules/court/dtos/update-court.dto.ts` | Added `defaultPriceCents` to update detail DTO. |
| `src/modules/court/use-cases/create-reservable-court.use-case.ts` | Persisted `defaultPriceCents`. |
| `src/modules/court/use-cases/create-simple-court.use-case.ts` | Persisted default price and free logic. |
| `src/modules/time-slot/repositories/time-slot.repository.ts` | Included default price/currency in slot detail payload. |
| `src/modules/reservation/services/reservation.service.ts` | Applied default price fallback for free/paid logic. |
| `src/modules/reservation/repositories/reservation.repository.ts` | Coalesced slot and court default price for owner reservations. |
| `src/features/discovery/hooks/use-court-detail.ts` | Mapped default price/currency for booking UI. |
| `src/features/discovery/components/booking-card.tsx` | Displayed accurate pricing/free states. |
| `src/app/(public)/courts/[id]/page.tsx` | Applied default price to slot list and booking card. |
| `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Used default price fallback for booking summary. |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Updated payment amount with default price fallback. |
| `src/app/(auth)/reservations/[id]/page.tsx` | Updated reservation detail pricing fallback. |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Passed default price to bulk slot modal. |
| `src/features/owner/components/bulk-slot-modal.tsx` | Adjusted default pricing label for free courts. |

## Key Decisions

- Stored default hourly rate as `reservable_court_detail.default_price_cents` to align with slot price cents.
- Used slot price when present, otherwise default price fallback across booking and payment.
- Managed court wizard steps via nuqs query state for deep linking and navigation.

## Next Steps

- [ ] Add migration/backfill for `default_price_cents`.
- [ ] Verify pricing in booking and payment flows with real data.

## Commands to Continue

```bash
# No commands required
```
