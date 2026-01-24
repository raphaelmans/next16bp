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
- Availability is **computed** (no stored slot rows)

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
          | time range: reserved (excluded from availability)
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
               |         +----------+
               |
               | owner accepts (free)
               v
          +----------+
          | CONFIRMED|
          +----------+

Cancellations (releases time range):

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

Availability effect of terminal transitions:
- CANCELLED → time range available again (computed)
- EXPIRED   → time range available again (computed)
```

---

## 2) Availability Computation (replaces time slot state machine)

There is no `time_slot` table. Availability is computed on-the-fly:

```text
+-----------------------------------------------------------------------------------+
|                            AVAILABILITY COMPUTATION                               |
+-----------------------------------------------------------------------------------+

  available_times(court, date) =

      schedule_rules(court, date)          ← from court_hours_window + court_rate_rule
    - active_reservations(court, date)     ← status NOT IN (CANCELLED, EXPIRED)
    - court_blocks(court, date)            ← owner-defined blocked ranges

+-----------------------------------------------------------------------------------+
|                              BLOCKING (EXCEPTIONS)                                |
+-----------------------------------------------------------------------------------+

  Owner actions:
    - Block time range   → INSERT court_block (courtId, startTime, endTime, reason)
    - Unblock time range → DELETE court_block

  Blocked ranges are excluded from availability computation.

+-----------------------------------------------------------------------------------+
|                              PRICE OVERRIDES                                      |
+-----------------------------------------------------------------------------------+

  Owner actions:
    - Override price for a date → INSERT court_price_override (courtId, date, price)

  Overrides take precedence over court_rate_rule for that date.
```

Notes:
- Reservation creation checks availability at request time (computed).
- No slot rows to lock or transition — reservations store the time range directly.

---

## 3) Combined "Happy Path" Timelines

### A) Free booking

```text
Player:   request booking (courtId + startTime + endTime)
Resv:     CREATED (expiresAt = now + 15m)
          → time range excluded from availability
Owner:    accepts (free)
Resv:     CONFIRMED
```

### B) Paid booking (mutual confirmation)

```text
Player:   request booking (courtId + startTime + endTime)
Resv:     CREATED (expiresAt = now + 15m)
          → time range excluded from availability
Owner:    accepts (paid)
Resv:     AWAITING_PAYMENT (expiresAt reset = now + 15m)
Player:   marks payment (uploads proof / confirms paid)
Resv:     PAYMENT_MARKED_BY_USER (can still expire)
Owner:    confirms payment
Resv:     CONFIRMED
```

---

## 4) Error / Edge Scenarios (What UX Must Make Clear)

```text
(1) Owner does nothing (TTL)
  Resv: CREATED -> EXPIRED
  → time range available again (computed)

(2) Player does not pay in time (TTL)
  Resv: AWAITING_PAYMENT -> EXPIRED
  → time range available again (computed)

(3) Player marks payment but owner never confirms (TTL)
  Resv: PAYMENT_MARKED_BY_USER -> EXPIRED
  → time range available again (computed)

(4) Owner rejects / cancels
  Resv: {CREATED|AWAITING_PAYMENT|PAYMENT_MARKED_BY_USER} -> CANCELLED
  → time range available again (computed)

(5) Player cancels (before cutoff)
  Resv: CONFIRMED -> CANCELLED
  → time range available again (computed)
```
