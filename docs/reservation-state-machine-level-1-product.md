# Reservation State Machine — Level 1 Product Narrative

## Narrative
- Free bookings confirm immediately.
- Paid bookings start a **court-specific payment window** (`paymentHoldMinutes`).
- After payment is marked:
  - If **owner confirmation is required**, the reservation waits for owner review (`ownerReviewMinutes`).
  - If **owner confirmation is not required**, the reservation auto-confirms.
- Player cancellation is allowed across all non-terminal states until the court’s cancellation cutoff window.

## Flow Diagram (Current)
```
┌─────────────────────────────────────────────────────────────┐
│                    FREE COURT BOOKING                        │
├─────────────────────────────────────────────────────────────┤
│  Player → Select Free Slot → Reserve                         │
│     ↓                                                        │
│  Reservation: CONFIRMED                                      │
│  Slot: AVAILABLE → BOOKED                                    │
│  ✅ Done (immediate confirmation)                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PAID COURT BOOKING                        │
├─────────────────────────────────────────────────────────────┤
│  Player → Select Paid Slot → Reserve                         │
│     ↓                                                        │
│  Reservation: AWAITING_PAYMENT                               │
│  expiresAt = NOW() + paymentHoldMinutes (per court)          │
│  Slot: AVAILABLE → HELD                                      │
│     ↓                                                        │
│  Player → /reservations/[id]/payment                         │
│     → Enter reference/notes                                  │
│     → Accept T&C                                             │
│     → "I Have Paid"                                          │
│     ↓                                                        │
│  If owner confirmation REQUIRED                              │
│     Reservation: PAYMENT_MARKED_BY_USER                      │
│     expiresAt = NOW() + ownerReviewMinutes                   │
│     Owner confirms / rejects                                 │
│  If owner confirmation NOT required                          │
│     Reservation: CONFIRMED (auto)                            │
│     Slot: HELD → BOOKED                                      │
│                                                              │
│  ⏱️ TTL Expiration:                                           │
│     Cron job (every minute)                                  │
│     → Reservation: EXPIRED                                   │
│     → Slot: HELD → AVAILABLE                                 │
│     → Audit event (SYSTEM role)                              │
└─────────────────────────────────────────────────────────────┘
```
