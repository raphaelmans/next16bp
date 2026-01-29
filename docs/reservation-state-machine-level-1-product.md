# Reservation State Machine — Level 1 Product Narrative

## Narrative

### Player bookings
- Player requests a booking: the **time range is reserved immediately** and the reservation is **awaiting owner acceptance**.
- Owner sees the request right away in the owner tools (alerts panel, active queue).
- Owner accepts within 45 minutes:
  - Free booking: becomes confirmed.
  - Paid booking: player gets a **fresh 45-minute payment window**.
  - Paid booking (offline payment): owner may confirm directly, bypassing the payment flow (`CREATED → CONFIRMED`).
- Player marks payment, then owner confirms payment to finalize.
- If any active timer runs out, the reservation expires and the time range becomes available again.

### Guest bookings (owner-created)
- Owner creates a booking on behalf of a walk-in or phone guest.
- The reservation is **confirmed immediately** — no request/acceptance/payment flow applies.
- Transition: `[*] → CONFIRMED` (owner creates guest booking with offline/handled payment).

### Identity invariant
A reservation always has **exactly one** of `playerId` or `guestProfileId`. These are mutually exclusive — player bookings carry `playerId`; guest bookings carry `guestProfileId`.

## Flow Diagram (Current)
```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BOOKING REQUEST (FREE / PAID)                    │
├──────────────────────────────────────────────────────────────────────────┤
│  Player → Select Time → Request Booking (player bookings only)           │
│     ↓                                                                    │
│  Reservation: CREATED (Awaiting owner acceptance)                        │
│  Time range: reserved (excluded from availability)                       │
│  Timer: 45 minutes to accept                                             │
│     ↓                                                                    │
│  Owner → Monitor active queue (immediate visibility)                     │
│     - Floating alerts panel                                              │
│     - /owner/reservations/active                                         │
│     - /owner/reservations/[id]                                           │
│     ↓                                                                    │
│  Owner → Accept                                                          │
│     ├─ Free booking: Reservation → CONFIRMED                             │
│     └─ Paid booking: Reservation → AWAITING_PAYMENT                      │
│                      Timer resets: 45-minute payment window starts now   │
│                                                                          │
│  Owner → Cancel/Reject during CREATED (releases time range)              │
│                                                                          │
│  Owner → Accept + Confirm Offline Payment (paid, offline):               │
│     Reservation → CONFIRMED (bypasses payment flow)                      │
│                                                                          │
│  ⏱️ If 45 minutes pass without acceptance:                               │
│     Reservation → EXPIRED (time range available again)                   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                     GUEST BOOKING (OWNER-CREATED)                        │
├──────────────────────────────────────────────────────────────────────────┤
│  Owner → Create Guest Booking (offline/handled payment)                  │
│     ↓                                                                    │
│  Reservation: CONFIRMED (immediately)                                    │
│  Time range: reserved (excluded from availability)                       │
│  No timers, no acceptance/payment flow                                   │
│  Identity: guestProfileId (not playerId)                                 │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                               PAID PAYMENT                               │
├──────────────────────────────────────────────────────────────────────────┤
│  Reservation: AWAITING_PAYMENT (45-minute payment timer)                 │
│     ↓                                                                    │
│  Player → /reservations/[id]/payment → "I Have Paid"                     │
│     ↓                                                                    │
│  Reservation: PAYMENT_MARKED_BY_USER                                     │
│     ↓                                                                    │
│  Owner → Confirm Payment                                                 │
│     ↓                                                                    │
│  Reservation: CONFIRMED                                                  │
│                                                                          │
│  Owner → Reject (after payment marked) or Cancel (while awaiting payment)│
│     → Reservation: CANCELLED (time range available again)                │
│                                                                          │
│  ⏱️ TTL Expiration (if timer passes):                                    │
│     Cron job (every minute) → Reservation: EXPIRED                       │
│     → Audit event (SYSTEM role), time range available again              │
└──────────────────────────────────────────────────────────────────────────┘
```

## Availability Model
- Availability is **computed** from schedule rules, not stored as slot rows.
- When a reservation is created, that time range is excluded from availability queries.
- When a reservation is cancelled/expired, the time range automatically becomes available again.
