# [01-64] Reservation Chat CTA Sync

> Date: 2026-02-06
> Previous: 01-63-agent-context-checkpoint.md

## Summary

Completed the reservation-chat UX follow-up by tightening two-lane chat/reservation sync behavior and adding a direct in-page `Message Owner` CTA on reservation detail. Updated player/owner story docs and support diagram to reflect deterministic refresh behavior and the new CTA entry point.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx` | Added deterministic sync orchestration for Stream + reservation metadata, partial/error sync messaging, and a `reservation-chat:open` event handler to open/focus a reservation thread from external CTAs. |
| `src/features/chat/components/chat-thread/stream-chat-thread.tsx` | Added context refresh integration (`onRefreshContext`, `isContextRefreshing`) so header refresh can sync thread + parent context together. |
| `src/features/chat/components/chat-widget/player-reservation-chat-widget.tsx` | Wired thread refresh to also refetch reservation session metadata. |
| `src/features/owner/hooks.ts` | Expanded owner reservation mutation invalidation to include chat metadata/session queries. |
| `src/features/reservation/hooks.ts` | Expanded player reservation mutation invalidation to include chat metadata/session queries. |
| `src/features/reservation/components/reservation-actions-card.tsx` | Added in-page `Message Owner` CTA that dispatches `reservation-chat:open` with current reservation id; kept email/phone actions as fallback. |
| `src/features/reservation/components/status-banner.tsx` | Updated `PAYMENT_MARKED_BY_USER` copy to remove "This usually takes a few hours." |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/user-stories/67-reservation-chat/67-01-player-messages-venue-from-reservation.md` | Added acceptance criteria for reservation-detail CTA opening the matching chat thread. |
| `agent-plans/user-stories/67-reservation-chat/67-02-owner-inbox-messages-across-reservations.md` | Documented two-lane refresh expectations and deterministic sync state behavior. |
| `agent-plans/user-stories/67-reservation-chat/67-04-player-chat-widget-on-reservations-switches-threads.md` | Added acceptance criteria for detail CTA deep-linking into active thread. |
| `agent-plans/user-stories/67-reservation-chat/67-10-chat-support-diagram.md` | Added refresh/sync state machine and detail CTA entry-point path. |

## Key Decisions

- Used an event-driven open/focus contract (`reservation-chat:open`) instead of introducing a new global store, to keep the change minimal-risk and immediate in same-tab UX.
- Kept `Message Owner` visible only for active reservation states (`CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, `CONFIRMED`) and hidden for ended states.
- Preserved existing contact fallbacks (`mailto`, `tel`) while promoting in-app chat as the primary coordination path.
- Kept chat sync as a two-lane model (messages + reservation metadata) with explicit partial/error feedback for better trust and retry clarity.

## Next Steps (if applicable)

- [ ] Manually verify CTA behavior across statuses (`CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, `CONFIRMED`, `CANCELLED`, `EXPIRED`) on desktop and mobile.
- [ ] Validate thread focus and read-only behavior after owner-side status transitions.
- [ ] Prepare a focused commit once unrelated workspace changes are separated.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
