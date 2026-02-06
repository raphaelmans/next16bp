# [01-65] Banner Chat CTA

> Date: 2026-02-06
> Previous: 01-64-reservation-chat-cta-sync.md

## Summary

Added a top status-banner `Message Owner` CTA on reservation detail so players can open chat immediately on mobile without scrolling to the actions card. Kept the existing `Pay Now` path intact and aligned docs to reflect both detail-page CTA surfaces.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/reservation/components/status-banner.tsx` | Added optional banner chat action (`onMessageOwner`) and rendered `Message Owner` CTA for active chat statuses while preserving `Pay Now` behavior. |
| `src/app/(auth)/reservations/[id]/page.tsx` | Wired banner CTA to dispatch `reservation-chat:open` with `{ kind: "player", reservationId, source: "reservation-status-banner" }`. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/user-stories/67-reservation-chat/67-01-player-messages-venue-from-reservation.md` | Updated acceptance criteria to include both reservation-detail chat entry points (status banner + actions card). |
| `agent-plans/user-stories/67-reservation-chat/67-04-player-chat-widget-on-reservations-switches-threads.md` | Clarified that either detail-page CTA surface opens and focuses the same reservation thread. |
| `agent-plans/user-stories/67-reservation-chat/67-10-chat-support-diagram.md` | Updated player entry-point and event notes to include banner CTA as an additional trigger path. |

## Key Decisions

- Reused the existing `reservation-chat:open` event contract to avoid introducing new state plumbing.
- Kept CTA visibility aligned with active chat states (`CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, `CONFIRMED`).
- Preserved existing actions-card CTA for redundancy and consistency across viewport sizes.

## Next Steps (if applicable)

- [ ] Manually verify banner CTA behavior on narrow mobile widths and ensure no wrapping/overflow regressions.
- [ ] Validate both banner and actions-card CTAs consistently focus the matching reservation thread.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
