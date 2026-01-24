# Reservation State Machine — Level 1 Product Narrative

## Narrative
- Player requests a booking: the **time range is reserved immediately** and the reservation is **awaiting owner acceptance**.
- Owner sees the request right away in the owner tools (alerts panel, active queue).
- Owner accepts within 15 minutes:
  - Free booking: becomes confirmed.
  - Paid booking: player gets a **fresh 15-minute payment window**.
- Player marks payment, then owner confirms payment to finalize.
- If any active timer runs out, the reservation expires and the time range becomes available again.

## Flow Diagram (Current)
```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BOOKING REQUEST (FREE / PAID)                    │
├──────────────────────────────────────────────────────────────────────────┤
│  Player → Select Time → Request Booking                                  │
│     ↓                                                                    │
│  Reservation: CREATED (Awaiting owner acceptance)                        │
│  Time range: reserved (excluded from availability)                       │
│  Timer: 15 minutes to accept                                             │
│     ↓                                                                    │
│  Owner → Monitor active queue (immediate visibility)                     │
│     - Floating alerts panel                                              │
│     - /owner/reservations/active                                         │
│     - /owner/reservations/[id]                                           │
│     ↓                                                                    │
│  Owner → Accept                                                          │
│     ├─ Free booking: Reservation → CONFIRMED                             │
│     └─ Paid booking: Reservation → AWAITING_PAYMENT                      │
│                      Timer resets: 15-minute payment window starts now   │
│                                                                          │
│  Owner → Cancel/Reject during CREATED (releases time range)              │
│                                                                          │
│  ⏱️ If 15 minutes pass without acceptance:                               │
│     Reservation → EXPIRED (time range available again)                   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                               PAID PAYMENT                               │
├──────────────────────────────────────────────────────────────────────────┤
│  Reservation: AWAITING_PAYMENT (15-minute payment timer)                 │
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
