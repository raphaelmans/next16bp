# [01-72] Payment Chat CTA Freshness

> Date: 2026-02-07
> Previous: 01-71-unified-portal-switcher.md

## Summary

Extended reservation chat access into the payment flow and fixed the stale post-submit status issue that could briefly show `AWAITING_PAYMENT` after successful payment submission. The payment page now offers direct `Message Owner` CTAs and warms critical reservation queries before redirecting.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Added `Message Owner` CTA in both payment form and completed-state card; dispatches `reservation-chat:open` with player context; added targeted query warmup (`reservation.getDetail`, `reservation.getMyWithDetails`) before redirect after `markPayment`. |
| `src/features/reservation/hooks.ts` | Fixed mutation freshness coverage: `useMarkPayment` now invalidates `reservation.getDetail` (in addition to existing invalidations); `useUploadPaymentProof` now invalidates scoped `reservation.getDetail` using `reservationId` from `FormData`. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/user-stories/67-reservation-chat/67-01-player-messages-venue-from-reservation.md` | Added payment-page `Message Owner` CTA as a direct player chat entry point. |
| `agent-plans/user-stories/67-reservation-chat/67-04-player-chat-widget-on-reservations-switches-threads.md` | Added acceptance criteria for payment-page CTA opening/focusing the matching reservation thread. |
| `agent-plans/user-stories/67-reservation-chat/67-10-chat-support-diagram.md` | Updated player entry-point docs to include `/reservations/[id]/payment` CTA and shared event contract. |

## Key Decisions

- Reused the existing chat-open event contract (`reservation-chat:open`) for payment page CTA consistency with reservation detail surfaces.
- Fixed stale UX via targeted tRPC cache invalidation + pre-navigation fetch, not global stale-time changes.
- Avoided `router.refresh()` for this fix because the issue is client query cache freshness, and direct query warmup is more deterministic.

## Next Steps (if applicable)

- [ ] Manually verify payment submit with and without proof upload no longer flashes stale `AWAITING_PAYMENT` on destination views.
- [ ] Confirm mobile payment page keeps CTA hierarchy clear (`Message Owner` secondary, `I Have Paid` primary).
- [ ] Verify chat opens on the correct reservation thread from payment page in both AWAITING and completed branches.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
