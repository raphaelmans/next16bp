# [00-22] Payment Flow UI Cleanup

> Date: 2026-01-13
> Previous: 00-21-remove-court-new-routes.md

## Summary

Moved payment instructions into the dedicated payment page and removed the duplicate payment info card from the booking review step. The payment info card now derives methods from policy-based slot payment details with a fallback when none exist.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/reservation/components/payment-info-card.tsx` | Refactored to accept payment details, render derived methods, and show fallback instructions. |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Replaced `PaymentInstructions` with `PaymentInfoCard` and wired expiry minutes from reservation. |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Removed booking review payment info card and hardcoded methods. |

### Planning

| File | Change |
|------|--------|
| `agent-plans/17-payment-flow-ux/17-00-overview.md` | Added master plan for payment flow cleanup. |
| `agent-plans/17-payment-flow-ux/17-01-payment-page-info.md` | Added phase plan for payment info relocation. |
| `agent-plans/17-payment-flow-ux/payment-flow-ux-dev1-checklist.md` | Added dev checklist for UI updates. |

## Key Decisions

- Centralized payment instructions on the payment route to avoid duplicate guidance in booking.
- Derived payment methods from `timeSlot` policy data, keeping fallback instructions when missing.

## Next Steps (if applicable)

- [ ] Consider removing `PaymentInstructions` if fully unused.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
