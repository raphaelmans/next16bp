# Reservation State Machine — Level 1 Product Narrative

## Narrative
- Player requests a booking: the slot is **held immediately** and the reservation is **awaiting owner acceptance**.
- Owner sees the request right away in the owner tools (slot list, alerts panel, active queue).
- Owner accepts within 15 minutes:
  - Free booking: becomes confirmed.
  - Paid booking: player gets a **fresh 15-minute payment window**.
- Player marks payment, then owner confirms payment to finalize.
- If any active timer runs out, the reservation expires and the slot is released.

## Flow Diagram (Current)
```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BOOKING REQUEST (FREE / PAID)                    │
├──────────────────────────────────────────────────────────────────────────┤
│  Player → Select Slot → Request Booking                                  │
│     ↓                                                                    │
│  Reservation: CREATED (Awaiting owner acceptance)                        │
│  Slot: AVAILABLE → HELD                                                  │
│  Timer: 15 minutes to accept                                             │
│     ↓                                                                    │
│  Owner → Monitor active queue (immediate visibility)                     │
│     - Slot list quick actions                                            │
│     - Floating alerts panel                                              │
│     - /owner/reservations/active                                         │
│     - /owner/reservations/[id]                                           │
│     ↓                                                                    │
│  Owner → Accept                                                         │
│     ├─ Free booking: Reservation → CONFIRMED, Slot HELD → BOOKED         │
│     └─ Paid booking: Reservation → AWAITING_PAYMENT                      │
│                      Timer resets: 15-minute payment window starts now   │
│                                                                          │
│  Owner → Cancel/Reject during CREATED (releases slot)                    │
│                                                                          │
│  ⏱️ If 15 minutes pass without acceptance:                               │
│     Reservation → EXPIRED, Slot HELD → AVAILABLE                         │
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
│  Reservation: CONFIRMED, Slot HELD → BOOKED                              │
│                                                                          │
│  Owner → Reject (after payment marked) or Cancel (while awaiting payment)│
│     → Reservation: CANCELLED, Slot HELD → AVAILABLE                      │
│                                                                          │
│  ⏱️ TTL Expiration (if timer passes):                                    │
│     Cron job (every minute) → Reservation: EXPIRED                       │
│     → Slot: HELD → AVAILABLE, Audit event (SYSTEM role)                  │
└──────────────────────────────────────────────────────────────────────────┘
```
