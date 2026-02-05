# 67-10: Reservation Chat Support Diagram

This document captures the *current shipped behavior* for where chat entry points appear and which reservation states allow chat access.

---

## Routes Where Chat Entry Points Appear

### Player

- Visible on reservation detail:
  - Route: `/reservations/[id]`
  - Page: `src/app/(auth)/reservations/[id]/page.tsx` (mounts `PlayerReservationChatWidget`)
- Not currently mounted on the payment route:
  - Route: `/reservations/[id]/payment`
  - Page: `src/app/(auth)/reservations/[id]/payment/page.tsx`

### Owner

- Visible across all owner routes (because it is mounted in the owner layout):
  - Route group base: `/owner/*`
  - Layout: `src/app/(owner)/layout.tsx` (mounts `OwnerChatWidget`)

Note: `src/common/providers/index.tsx` provides app-wide providers (tRPC/Query/etc). It does not mount the chat widgets.

---

## Reservation Status State Machine + Chat Visibility

Legend:
- `P` = player chat icon visible (player widget is rendered)
- `O` = owner chat icon visible (owner inbox widget is rendered)

```
                  (owner accepts)
  +---------+      paid booking      +------------------+
  | CREATED | ---------------------> | AWAITING_PAYMENT |
  |  P, O   |                        |      P, O        |
  +----+----+                        +--------+---------+
       |                                      |
       | (owner accepts)
       | free booking                          | (player marks paid)
       v                                      v
  +--------------+                    +------------------------+
  |  CONFIRMED   | <----------------- | PAYMENT_MARKED_BY_USER |
  |    P, O      |   (owner confirms) |         P, O           |
  +------+-------+                    +-----------+------------+
         |
         | (cancellation/system expiry)
         v
  +----------------+        +----------------+
  |   CANCELLED    |        |    EXPIRED     |
  |  P: hidden     |        |  P: hidden     |
  |  O: visible    |        |  O: visible    |
  +----------------+        +----------------+
```

Important nuance (current behavior):
- Player widget is only rendered for: `CREATED | AWAITING_PAYMENT | PAYMENT_MARKED_BY_USER | CONFIRMED`.
- Owner inbox widget is rendered for all `/owner/*` routes regardless of reservation status.
- Owner can still see and message existing reservation channels in the inbox even if a reservation becomes `CANCELLED` or `EXPIRED` (because owner auth is not reservation-status gated).

---

## Widget Mounting Diagram (UI)

### Owner

```
src/app/(owner)/layout.tsx (server)
  -> <OwnerChatWidget /> (client)
       -> fixed button (bottom-right)
       -> Sheet inbox (list + active thread)
```

### Player

```
src/app/(auth)/reservations/[id]/page.tsx (client)
  -> <PlayerReservationChatWidget reservationId reservationStatus />
       -> fixed button (bottom-right)
       -> Sheet thread for reservation channel
       -> auto-open once when status becomes CONFIRMED
```

---

## Data/Eligibility Notes (Support)

- Player widget render gate (client): active reservation status list in `src/features/chat/components/chat-widget/player-reservation-chat-widget.tsx`.
- Reservation chat access gate (server): `src/lib/modules/chat/services/reservation-chat.service.ts`.
- Owner inbox contents are provider-driven:
  - Lists Stream channels where the owner is a member and the channel id starts with `res-`.
  - New reservations attempt to create the channel best-effort at reservation creation time (`ensureReservationThreadForReservation`). If that fails, the channel is created on-demand when a participant opens chat.

---

## References

- Owner widget: `src/features/chat/components/chat-widget/owner-chat-widget.tsx`
- Owner layout mount: `src/app/(owner)/layout.tsx`
- Player widget: `src/features/chat/components/chat-widget/player-reservation-chat-widget.tsx`
- Player route mount: `src/app/(auth)/reservations/[id]/page.tsx`
- Reservation creation best-effort thread ensure: `src/lib/modules/reservation/services/reservation.service.ts`
- Ensure thread op: `src/lib/modules/chat/ops/ensure-reservation-thread.ts`
