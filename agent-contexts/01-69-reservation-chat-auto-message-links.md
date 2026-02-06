# [01-69] Reservation Chat Auto Message Links

> Date: 2026-02-06
> Previous: 01-68-agent-context-checkpoint.md

## Summary

Implemented automatic owner confirmation chat seeding when reservations move to `CONFIRMED`, including deep links for player and owner flows. Also fixed counterparty message bubble styling so non-user chat messages render with proper bubble UI.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/modules/chat/providers/chat.provider.ts` | Extended provider contract with `sendReservationMessage` and `SendReservationMessageInput`. |
| `src/lib/modules/chat/providers/stream-chat.provider.ts` | Implemented reservation message sending with duplicate-safe handling for idempotent message IDs. |
| `src/lib/modules/chat/ops/post-owner-confirmed-message.ts` | Added owner confirmation auto-message op with deterministic message id and deep links to player reservation detail and owner reservations pages. |
| `src/lib/modules/reservation/services/reservation-owner.service.ts` | Added best-effort post-confirmation chat message dispatch for owner confirmation paths (`acceptReservation` free flow, `confirmPayment`, `confirmPaidOffline`). |
| `src/lib/modules/reservation/factories/reservation.factory.ts` | Injected profile repository into owner service wiring to resolve player user id for chat participants. |
| `src/components/ai-elements/message.tsx` | Added assistant/counterparty bubble styling so non-user messages render as visual chat bubbles. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/user-stories/67-reservation-chat/67-01-player-messages-venue-from-reservation.md` | Added acceptance criteria for default owner confirmation message and no-duplicate behavior. |
| `agent-plans/user-stories/67-reservation-chat/67-02-owner-inbox-messages-across-reservations.md` | Added owner inbox expectation that auto confirmation message appears in thread history. |
| `agent-plans/user-stories/67-reservation-chat/67-04-player-chat-widget-on-reservations-switches-threads.md` | Added player expectation for seeing auto confirmation message in thread history. |
| `agent-plans/user-stories/67-reservation-chat/67-10-chat-support-diagram.md` | Updated support diagram notes to reflect confirmation-time default message seeding. |

## Key Decisions

- Kept auto-message posting outside DB transactions (best-effort) so reservation confirmation is never blocked by chat provider failures.
- Used deterministic message IDs (`reservation:{reservationId}:owner-confirmed:v1`) to prevent duplicate seeded messages on retries.
- Included both links in seeded message content:
  - player reservation detail (`/reservations/{id}`)
  - owner handling page (`/owner/reservations`)
- Resolved missing bubble issue by fixing shared `ai-elements` message styling rather than patching per-page consumers.

## Next Steps (if applicable)

- [ ] Manually verify all three confirmation paths seed exactly one message in shared thread history.
- [ ] Validate links in seeded messages open expected destinations in local/dev and production URL contexts.
- [ ] Confirm mobile chat layout still looks correct after assistant bubble styling change.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
