# Reservation State Machine — Level 1 Product Narrative

## Narrative
- Player selects a slot: free courts confirm instantly, paid courts start a 15-minute countdown.
- Paid booking shows “Awaiting payment”, then “Payment marked” after the player marks payment.
- Owner monitors active reservations and can take action quickly:
  - While “Awaiting payment”: owner can view or cancel the reservation.
  - While “Payment marked”: owner can confirm or reject the reservation.
- If the TTL expires (even after payment is marked), the reservation expires and the slot is released.

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
│  Reservation: AWAITING_PAYMENT (expiresAt = NOW() + 15min)  │
│  Slot: AVAILABLE → HELD                                      │
│     ↓                                                        │
│  [15-Min Window]                                             │
│     ↓                                                        │
│  Player → /reservations/[id]/payment                         │
│     → Enter reference/notes                                  │
│     → Accept T&C                                             │
│     → "I Have Paid"                                          │
│     ↓                                                        │
│  Reservation: PAYMENT_MARKED_BY_USER                         │
│  Slot: HELD (unchanged)                                      │
│     ↓                                                        │
│  Owner → Monitor active reservations                         │
│     - Slot list quick actions                                │
│     - Floating alerts panel                                  │
│     - /owner/reservations/active                             │
│     - /owner/reservations/[id]                               │
│     → Confirm Payment (only after "Payment marked")          │
│     → Reject (after "Payment marked")                        │
│     → Cancel (while "Awaiting payment")                      │
│     ↓                                                        │
│  Reservation: CONFIRMED                                      │
│  Slot: HELD → BOOKED                                         │
│  ✅ Done                                                     │
│                                                              │
│  ⏱️ TTL Expiration (if 15 min passes):                      │
│     Cron job (every minute)                                  │
│     → Reservation: EXPIRED                                   │
│     → Slot: HELD → AVAILABLE                                 │
│     → Audit event (SYSTEM role)                              │
└─────────────────────────────────────────────────────────────┘
```
