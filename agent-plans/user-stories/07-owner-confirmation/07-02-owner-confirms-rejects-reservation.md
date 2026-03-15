# US-07-02: Owner Confirms or Rejects Reservation

**Status:** Active  
**Domain:** 07-owner-confirmation  
**PRD Reference:** Section 7 Journey 4, Section 15.1  
**Supersedes:** Part of US-03-03

---

## Story

As an **organization owner**, I want to **confirm or reject pending reservations** so that **players know their booking status and slots are correctly managed**.

---

## Context

This story covers the actions an owner can take on a pending reservation:
- **Confirm:** Finalize the booking (player paid correctly)
- **Reject:** Cancel the booking (payment issue or other reason)

**Previous context:** See `03-court-reservation/03-03-owner-confirms-payment.md` for original story.

---

## Acceptance Criteria

### Confirm Payment

- Given I am viewing a pending reservation (PAYMENT_MARKED_BY_USER)
- When I click "Confirm Payment"
- Then the system calls `reservationOwner.confirmPayment`
- And reservation status changes to `CONFIRMED`
- And slot status changes to `BOOKED`
- And I see success toast: "Reservation confirmed"
- And the reservation moves from pending list

### Reject Reservation

- Given I am viewing a pending reservation
- When I click "Reject"
- Then I see a prompt to enter rejection reason
- When I enter a reason and confirm
- Then the system calls `reservationOwner.reject`
- And reservation status changes to `CANCELLED`
- And slot status changes to `AVAILABLE`
- And I see success toast: "Reservation rejected"
- And the slot is now bookable again

### Rejection Reason Required

- Given I click "Reject"
- When the rejection modal/prompt appears
- Then I must enter a reason before confirming
- And empty reason shows validation error

### List Updates After Action

- Given I confirm or reject a reservation
- When the action completes
- Then the reservation list refreshes
- And the pending count updates
- And sidebar badge updates

### Audit Trail

- Given I confirm or reject a reservation
- When the action completes
- Then a reservation event is logged with:
  - From status: PAYMENT_MARKED_BY_USER
  - To status: CONFIRMED or CANCELLED
  - Triggered by: My user ID
  - Role: OWNER
  - Notes: Rejection reason (if reject)

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Double-click confirm | Prevent duplicate submission |
| Reservation already actioned | Error: "Reservation already processed" |
| Network error | Error toast with retry |
| Reject without reason | Validation error, require reason |
| Concurrent action | Last write wins, show updated state |

---

## Action Buttons

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Reservation Details                                                         │
│                                                                             │
│ Player: Juan Dela Cruz                                                      │
│ Phone: 0917-123-4567                                                        │
│ Email: juan@email.com                                                       │
│                                                                             │
│ Court: Court A                                                              │
│ Date: January 10, 2025                                                      │
│ Time: 2:00 PM - 3:00 PM                                                     │
│ Amount: ₱200                                                                │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│                              [Reject]    [Confirm Payment]                  │
│                              secondary   primary (teal)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Reject Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Reject Reservation                                          │
│                                                             │
│ Please provide a reason for rejection:                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Payment not received                                    │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ This will cancel the reservation and release the slot.      │
│                                                             │
│                           [Cancel]    [Reject Reservation]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Status Transitions

### Confirm Flow

```
PAYMENT_MARKED_BY_USER ──► CONFIRMED
        │                      │
        │                      │
   Slot: HELD              Slot: BOOKED
```

### Reject Flow

```
PAYMENT_MARKED_BY_USER ──► CANCELLED
        │                      │
        │                      │
   Slot: HELD              Slot: AVAILABLE
```

---

## API Integration

### Confirm Payment

**Endpoint:** `reservationOwner.confirmPayment`

**Input:**
```typescript
{
  reservationId: string,
  notes?: string  // Optional confirmation notes
}
```

**Response:**
```typescript
{
  id: string,
  status: "CONFIRMED",
  // ...
}
```

### Reject Reservation

**Endpoint:** `reservationOwner.reject`

**Input:**
```typescript
{
  reservationId: string,
  reason: string  // Required
}
```

**Response:**
```typescript
{
  id: string,
  status: "CANCELLED",
  cancellationReason: string,
  // ...
}
```

---

## Frontend Hooks

| Hook | File | Status |
|------|------|--------|
| `useConfirmReservation` | `src/features/owner/hooks/use-owner-reservations.ts` | Connected |
| `useRejectReservation` | Same file | Connected |

Both hooks are already connected to tRPC endpoints:

```typescript
export function useConfirmReservation() {
  return useMutation({
    ...trpc.reservationOwner.confirmPayment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservationOwner"] });
    },
  });
}

export function useRejectReservation() {
  return useMutation({
    ...trpc.reservationOwner.reject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservationOwner"] });
    },
  });
}
```

---

## Audit Event Structure

Per PRD Section 15.1:

```typescript
{
  reservationId: string,
  fromStatus: "PAYMENT_MARKED_BY_USER",
  toStatus: "CONFIRMED" | "CANCELLED",
  triggeredById: string,    // Owner's user ID
  triggeredByRole: "OWNER",
  timestamp: Date,
  notes: string | null      // Rejection reason
}
```

---

## Testing Checklist

- [ ] Confirm button visible for pending reservations
- [ ] Click confirm triggers API call
- [ ] Reservation status changes to CONFIRMED
- [ ] Slot status changes to BOOKED
- [ ] Success toast appears
- [ ] List refreshes after confirm
- [ ] Pending count decreases
- [ ] Reject button visible
- [ ] Click reject shows reason prompt
- [ ] Cannot reject without reason
- [ ] Reject triggers API call with reason
- [ ] Reservation status changes to CANCELLED
- [ ] Slot status changes to AVAILABLE
- [ ] Success toast appears
- [ ] List refreshes after reject
- [ ] Audit event created (check backend logs)
- [ ] Prevent double-click submission
- [ ] Error handling for network issues

---

## Deferred

- Payment proof display (see `08-p2p-reservation-confirmation`)
- P2P verification flow
- Owner-initiated cancellation (different from reject - for already confirmed)

---

## References

- PRD: Section 7 Journey 4 (Owner Confirms Payment)
- PRD: Section 15.1 (Reservation Audit Trail)
- Original: `03-court-reservation/03-03-owner-confirms-payment.md`
- Hooks: `src/features/owner/hooks/use-owner-reservations.ts`
