# Reservation State Machine — Level 1 Product Narrative

## Narrative
- Player selects a slot: free courts confirm instantly, paid courts start a countdown.
- Paid booking shows “Awaiting payment” and then “Awaiting confirmation” after payment is marked.
- Owner manually confirms payment; rejection or timeout frees the slot.

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
│  Owner → /owner/reservations → View pending                  │
│     → Confirm Payment                                        │
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
