# 67-10: Reservation Chat Support Diagram

This document captures the current reservation chat mounting behavior, reservation-state visibility rules, and the two-lane refresh sync model.

---

## Routes Where Chat Entry Points Appear

### Player

- Visible via the authenticated player shell floating panel:
  - Shell: `src/components/layout/player-shell.tsx` (mounts `PlayerChatWidget`)
  - Widget: `src/features/chat/components/chat-widget/player-chat-widget.tsx`
- Reservation detail adds two in-page `Message Owner` CTA surfaces that open and focus the global widget on the current reservation thread:
  - top status banner CTA
  - reservation actions card CTA
- Primary product target remains reservation workflows (`/reservations` and reservation detail views inside the same shell).

### Owner

- Visible across all owner routes (mounted in owner layout):
  - Route group base: `/owner/*`
  - Layout: `src/app/(owner)/layout.tsx` (mounts `OwnerChatWidget`)

Note: `src/common/providers/index.tsx` provides app-wide providers (tRPC/Query/etc). It does not mount the chat widgets.

---

## Reservation Status State Machine + Chat Visibility

Legend:
- `P` = player chat icon visible
- `O` = owner inbox icon visible

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
  |  read-only     |        |  read-only     |
  +----------------+        +----------------+
```

Important nuance:
- Owner inbox remains visible for all `/owner/*` routes.
- Ended owner conversations are viewable but read-only in `CANCELLED` and `EXPIRED` states.
- Confirmed reservations move to archive and become read-only after end time.
- On owner confirmation to `CONFIRMED`, the system seeds one default owner message in the reservation thread.

---

## Refresh/Sync State Machine (Two Lanes)

Two data lanes must refresh together:
- Stream lane: channels/messages/unread
- Reservation lane: status/archive/read-only metadata

```
IDLE_SYNCED
  -> (MANUAL_REFRESH_LIST | MANUAL_REFRESH_THREAD | STREAM_MESSAGE_EVENT | WIDGET_OPEN)
SYNCING_BOTH
  -> (both success) IDLE_SYNCED
  -> (stream success, meta fail) PARTIAL_STREAM
  -> (meta success, stream fail) PARTIAL_META
  -> (both fail) ERROR

PARTIAL_STREAM | PARTIAL_META | ERROR
  -> (any refresh trigger) SYNCING_BOTH
```

Refresh contract:
- Inbox refresh and thread-header refresh both run the two-lane sync.
- Reservation status mutations invalidate reservation + chat metadata queries so list/thread state converges quickly.
- Reservation detail CTAs dispatch a widget-open event (`reservation-chat:open`) with `reservationId` to open and focus chat immediately.

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
src/components/layout/player-shell.tsx (client)
  -> <PlayerChatWidget /> (client)
       -> fixed button (bottom-right)
       -> Sheet inbox (list + active thread)
```

---

## Data/Eligibility Notes (Support)

- Reservation chat access gate (server): `src/lib/modules/chat/services/reservation-chat.service.ts`.
- Reservation metadata hydration (status/time/place/court): `src/lib/modules/chat/reservation-chat.router.ts` (`getThreadMetas`).
- Owner inbox contents are provider-driven:
  - Lists Stream channels where owner is a member and channel id starts with `res-`.
  - New reservations attempt to create channels best-effort on creation (`ensureReservationThreadForReservation`); fallback is on-demand channel ensure when chat opens.

---

## References

- Owner widget: `src/features/chat/components/chat-widget/owner-chat-widget.tsx`
- Owner layout mount: `src/app/(owner)/layout.tsx`
- Player widget: `src/features/chat/components/chat-widget/player-chat-widget.tsx`
- Player shell mount: `src/components/layout/player-shell.tsx`
- Reservation detail CTA: `src/features/reservation/components/reservation-actions-card.tsx`
- Inbox/thread sync UI: `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx`
- Thread refresh behavior: `src/features/chat/components/chat-thread/stream-chat-thread.tsx`
- Reservation creation best-effort thread ensure: `src/lib/modules/reservation/services/reservation.service.ts`
- Ensure thread op: `src/lib/modules/chat/ops/ensure-reservation-thread.ts`
