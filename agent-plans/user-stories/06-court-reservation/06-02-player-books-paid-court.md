# US-06-02: Player Books Paid Court

**Status:** Active  
**Domain:** 06-court-reservation  
**PRD Reference:** Section 7 Journey 3, Section 8.3  
**Supersedes:** US-03-02 (simplified)

---

## Story

As a **player**, I want to **book a paid court slot** so that **I can reserve premium court time and mark my external payment as complete**.

---

## Context

This story covers the paid reservation path with a **simplified flow**:
1. Player selects paid slot → reservation created (AWAITING_PAYMENT)
2. Player pays externally (GCash, bank, cash)
3. Player clicks "I Have Paid" → status becomes PAYMENT_MARKED_BY_USER
4. Owner confirms → handled in 07-owner-confirmation

**Simplified scope:** No TTL timer, no payment proof upload, no expiration handling. See `08-p2p-reservation-confirmation` for full P2P flow.

**Previous context:** See `03-court-reservation/03-02-player-books-paid-court.md` for original story with full P2P requirements.

---

## Acceptance Criteria

### Discover Paid Slots

- Given I am on a court detail page
- When the court has available slots with price > 0
- Then I see time slots with price badge (e.g., "₱200")
- And slots show start time, end time, duration

### Select Paid Slot

- Given I am viewing available paid slots
- When I click on an available paid slot
- Then I am taken to the booking page
- And I see the price clearly displayed

### Create Reservation

- Given I am authenticated with complete profile
- When I click "Reserve" on a paid slot
- Then a reservation is created via `reservation.create({ timeSlotId })`
- And reservation status is `AWAITING_PAYMENT`
- And slot status changes to `HELD`
- And I am redirected to the payment page

### Payment Page (Simplified)

- Given my reservation is in AWAITING_PAYMENT
- When I view `/reservations/[id]/payment`
- Then I see:
  - Amount due (formatted price)
  - Reservation details (court, date, time)
  - "I Have Paid" button

### Mark Payment Complete

- Given I am on the payment page
- When I click "I Have Paid"
- Then the system calls `reservation.markPayment({ reservationId, termsAccepted: true })`
- And reservation status changes to `PAYMENT_MARKED_BY_USER`
- And I see "Awaiting owner confirmation" message

### Awaiting Confirmation

- Given my payment is marked
- When I view my reservation
- Then I see status "Pending Confirmation"
- And I understand the owner will confirm shortly

### View in My Reservations

- Given I have a pending reservation
- When I view `/reservations`
- Then I see my reservation with "Pending" status
- And I can click to view details

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Slot taken before confirm | Error: "Slot no longer available" |
| Already marked paid | Prevent double submission |
| Network error | Error toast with retry |
| Reservation not found | 404 error page |

---

## User Flow

```
/courts/[id] (court detail)
        │
        ├── View paid slots with prices
        │
        ▼
Click slot → /courts/[id]/book/[slotId]
        │
        ▼
[Reserve] button
        │
        ▼
reservation.create({ timeSlotId })
        │
        ├── Status: AWAITING_PAYMENT
        │   Slot: HELD
        │
        ▼
/reservations/[id]/payment
        │
        ├── See amount due
        │
        ▼
Player pays externally (GCash, bank, cash)
        │
        ▼
[I Have Paid] button
        │
        ▼
reservation.markPayment({ reservationId, termsAccepted: true })
        │
        ├── Status: PAYMENT_MARKED_BY_USER
        │
        ▼
"Awaiting owner confirmation"
        │
        ▼
(Owner confirms in 07-owner-confirmation)
```

---

## API Integration

### Create Reservation

**Endpoint:** `reservation.create`

**Input:**
```typescript
{
  timeSlotId: string
}
```

**Response (Paid Court):**
```typescript
{
  id: string,
  status: "AWAITING_PAYMENT",
  timeSlotId: string,
  playerId: string,
  // Note: expiresAt may be set but TTL not enforced in this simplified version
}
```

### Mark Payment

**Endpoint:** `reservation.markPayment`

**Input:**
```typescript
{
  reservationId: string,
  termsAccepted: true  // Required, must be true
}
```

**Response:**
```typescript
{
  id: string,
  status: "PAYMENT_MARKED_BY_USER",
  // ...
}
```

### Frontend Hook: useMarkPayment

**May need to create or verify exists:**

```typescript
export function useMarkPayment() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservation.markPayment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}
```

---

## Payment Page Layout (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Complete Your Reservation                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Court: Court A at Sports Complex                    │   │
│  │ Date: January 10, 2025                              │   │
│  │ Time: 2:00 PM - 3:00 PM                             │   │
│  │ Amount: ₱200                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Please pay the court owner directly via:                   │
│  - GCash                                                    │
│  - Bank Transfer                                            │
│  - Cash (on arrival)                                        │
│                                                             │
│  After paying, click the button below.                      │
│                                                             │
│  [I Have Paid]                                              │
│                                                             │
│  Note: The court owner will confirm your payment            │
│  and you'll receive confirmation.                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Note:** Payment instructions (GCash number, bank account) are **deferred** to `08-p2p-reservation-confirmation`. For now, show generic text.

---

## Status Transitions

```
AVAILABLE slot
      │
      ▼ reservation.create
┌─────────────────────┐
│ AWAITING_PAYMENT    │ ◄── Slot becomes HELD
└─────────────────────┘
      │
      ▼ reservation.markPayment
┌───────────────────────────┐
│ PAYMENT_MARKED_BY_USER    │ ◄── Slot still HELD
└───────────────────────────┘
      │
      ▼ (Owner action - see 07-owner-confirmation)
┌─────────────────────┐
│ CONFIRMED           │ ◄── Slot becomes BOOKED
└─────────────────────┘
```

---

## Testing Checklist

- [ ] Discover paid slots with price badges
- [ ] Price displays correctly (formatted)
- [ ] Reserve button creates AWAITING_PAYMENT reservation
- [ ] Slot status changes to HELD
- [ ] Redirect to payment page works
- [ ] Payment page shows correct details
- [ ] "I Have Paid" button works
- [ ] Status changes to PAYMENT_MARKED_BY_USER
- [ ] "Awaiting confirmation" message displays
- [ ] Reservation appears in "My Reservations" as pending
- [ ] Error handling for slot taken

---

## Deferred to 08-p2p-reservation-confirmation

| Feature | Reason |
|---------|--------|
| 15-minute TTL timer | Simplification |
| Countdown UI | Simplification |
| Payment instructions (GCash/bank details) | Simplification |
| Payment proof upload | Simplification |
| Reference number input | Simplification |
| Expiration handling | Simplification |
| T&C checkbox UI | Simplified to `termsAccepted: true` |

---

## References

- PRD: Section 7 Journey 3 (Paid Court Booking)
- PRD: Section 8.3 (Paid Court Lifecycle)
- Original: `03-court-reservation/03-02-player-books-paid-court.md`
- Future: `08-p2p-reservation-confirmation` for full P2P flow
