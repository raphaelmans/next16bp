# Reservation State Machine (ASCII)

This is an ASCII companion to the reservation contract described in:
- `docs/reservation-state-machine.md`
- `docs/reservation-state-machine-level-1-product.md`
- `docs/reservation-state-machine-level-2-engineering.md`

It models the current **mutual confirmation** flow with TTL expiration.

---

## 1) Reservation Status State Machine

Legend:
- `expiresAt`: a timestamp used by the cron expirer
- `TTL cron`: system job that transitions to `EXPIRED` when `expiresAt < now`

```text
                             +---------------------+
                             |     (START)         |
                             | player requests     |
                             | booking             |
                             +----------+----------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                                   RESERVATION                                     |
+-----------------------------------------------------------------------------------+

          +-------------------+
          |     CREATED       |
          | slot: AVAILABLE→HELD
          | expiresAt: now + 15m (owner accept window)
          +----+--------+---+
               |        |
               |        | owner accepts (paid)
               |        v
               |   +-------------------+
               |   |  AWAITING_PAYMENT |
               |   | expiresAt: now + 15m (payment window)
               |   +----+--------+---+
               |        |        |
               |        | player marks payment
               |        v        |
               |   +------------------------+
               |   | PAYMENT_MARKED_BY_USER |
               |   | (can still expire)     |
               |   +----------+-------------+
               |              |
               |              | owner confirms payment
               |              v
               |         +----------+
               |         | CONFIRMED|
               |         | slot: HELD→BOOKED
               |         +----------+
               |
               | owner accepts (free)
               v
          +----------+
          | CONFIRMED|
          | slot: HELD→BOOKED
          +----------+

Cancellations (release the hold):

  CREATED ---------------> CANCELLED
  AWAITING_PAYMENT ------> CANCELLED
  PAYMENT_MARKED_BY_USER -> CANCELLED
  CONFIRMED -------------> CANCELLED (before cutoff)

Expiration (system):

  CREATED ---------------> EXPIRED
  AWAITING_PAYMENT ------> EXPIRED
  PAYMENT_MARKED_BY_USER -> EXPIRED

Final states:

  CONFIRMED, CANCELLED, EXPIRED

Slot effect of terminal transitions:
- CANCELLED → slot: HELD→AVAILABLE (or BOOKED→AVAILABLE for pre-cutoff cancels)
- EXPIRED   → slot: HELD→AVAILABLE
```

---

## 2) Time Slot Status State Machine (as used by reservations)

```text
+-----------------------------------------------------------------------------------+
|                                   TIME SLOT                                       |
+-----------------------------------------------------------------------------------+

                 owner blocks                      owner unblocks
       +----------------------------------+    +-------------------+
       |                                  v    v                   |
   +----------+  createPaidReservation  +------+-----+  cancel/expire +----------+
   | AVAILABLE| ----------------------> |   HELD    | -------------> | AVAILABLE|
   +----------+                         +------+-----+               +----------+
       |                                      |
       | createFreeReservation                 | confirm paid OR accept free
       v                                      v
   +----------+  player/owner cancel      +----------+
   |  BOOKED  | -----------------------> | AVAILABLE |
   +----------+   (before cutoff)        +----------+

Also:
  AVAILABLE <-> BLOCKED (owner actions)

Notes:
- Reservation creation is allowed only when the slot is `AVAILABLE`.
- Reservation requests immediately hold the slot (`AVAILABLE → HELD`).
```

---

## 3) Combined “Happy Path” Timelines

### A) Free booking

```text
Player:   request booking
Slot:     AVAILABLE -> HELD
Resv:     CREATED (expiresAt = now + 15m)
Owner:    accepts (free)
Resv:     CONFIRMED
Slot:     HELD -> BOOKED
```

### B) Paid booking (mutual confirmation)

```text
Player:   request booking
Slot:     AVAILABLE -> HELD
Resv:     CREATED (expiresAt = now + 15m)
Owner:    accepts (paid)
Resv:     AWAITING_PAYMENT (expiresAt reset = now + 15m)
Player:   marks payment (uploads proof / confirms paid)
Resv:     PAYMENT_MARKED_BY_USER (can still expire)
Owner:    confirms payment
Resv:     CONFIRMED
Slot:     HELD -> BOOKED
```

---

## 4) Error / Edge Scenarios (What UX Must Make Clear)

```text
(1) Owner does nothing (TTL)
  Resv: CREATED -> EXPIRED
  Slot: HELD -> AVAILABLE

(2) Player does not pay in time (TTL)
  Resv: AWAITING_PAYMENT -> EXPIRED
  Slot: HELD -> AVAILABLE

(3) Player marks payment but owner never confirms (TTL)
  Resv: PAYMENT_MARKED_BY_USER -> EXPIRED
  Slot: HELD -> AVAILABLE

(4) Owner rejects / cancels
  Resv: {CREATED|AWAITING_PAYMENT|PAYMENT_MARKED_BY_USER} -> CANCELLED
  Slot: HELD -> AVAILABLE

(5) Player cancels (before cutoff)
  Resv: CONFIRMED -> CANCELLED
  Slot: BOOKED -> AVAILABLE
```
