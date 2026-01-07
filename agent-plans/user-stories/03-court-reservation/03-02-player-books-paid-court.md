# US-03-02: Player Books Paid Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **book a paid court slot** so that **I can reserve premium court time with external payment**.

---

## Acceptance Criteria

### View Pricing

- Given I am on a court detail page
- When the court has paid slots
- Then I see time slots with price badges (e.g., "P200/hr")

### Initiate Booking

- Given I am authenticated with complete profile
- When I click a paid slot and confirm
- Then a reservation is created with status `AWAITING_PAYMENT`
- And the slot status changes to `HELD`
- And a 15-minute countdown timer starts

### View Payment Instructions

- Given my reservation is created
- When I am redirected to `/reservations/[id]/payment`
- Then I see: amount due, payment methods (GCash, bank), countdown timer

### Mark as Paid

- Given I am on the payment page
- When I pay externally and click "I Have Paid"
- Then I must accept the Terms & Conditions checkbox
- And I can optionally enter reference number/notes
- And status changes to `PAYMENT_MARKED_BY_USER`

### Upload Payment Proof

- Given I have marked payment as complete
- When I provide reference number or notes
- Then the proof is saved with the reservation

### Timer Expiration

- Given 15 minutes have passed
- When I have NOT marked payment
- Then reservation status changes to `EXPIRED`
- And slot status changes to `AVAILABLE`
- And I see "Reservation expired" message

### Awaiting Owner Confirmation

- Given I marked payment complete
- When the owner has not yet confirmed
- Then I see "Awaiting confirmation" status
- And the reservation remains visible in My Reservations

---

## Edge Cases

- Timer expires while on payment page - Show expired message, offer to retry with new slot
- User closes browser during payment window - Cron job expires reservation after 15 min
- Duplicate payment proof upload - Reject with "Proof already submitted" error
- Slot becomes unavailable - Show error, redirect to court detail
- Network error - Show toast with retry

---

## Booking Flow

```
/courts/[id]
    │
    ▼
Select paid slot
    │
    ▼
/courts/[id]/book/[slotId]
    │
    ▼
[Reserve] ─── Creates reservation (AWAITING_PAYMENT)
    │         Updates slot (HELD)
    │         Sets expiresAt = NOW() + 15 min
    ▼
/reservations/[id]/payment
    │
    ▼
[I Have Paid] + T&C ─── Updates to PAYMENT_MARKED_BY_USER
    │
    ▼
Awaiting owner confirmation
    │
    ▼
Owner confirms → CONFIRMED, slot → BOOKED
```

---

## Payment Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Complete Your Payment                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Amount Due: P200                                    │   │
│  │                                                     │   │
│  │ Time Remaining: 12:34                               │   │
│  │ [████████████░░░░░░░░]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Payment Methods:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ GCash: 0917-123-4567                                │   │
│  │ Bank: BDO 1234-5678-9012 (Juan Dela Cruz)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Reference Number (optional):                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Notes (optional):                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [x] I have read and accept the Terms & Conditions          │
│      and acknowledge that KudosCourts does not process      │
│      payments.                                              │
│                                                             │
│  [I Have Paid]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Input |
|----------|--------|-------|
| `reservation.create` | Mutation | `{ slotId }` |
| `paymentProof.upload` | Mutation | `{ reservationId, referenceNumber?, notes? }` |

---

## References

- PRD: Section 7 Journey 3 (Paid Court Booking)
- PRD: Section 8.3-8.4 (Paid Lifecycle, TTL Rules)
- PRD: Section 17 (Legal & Liability - T&C requirement)
