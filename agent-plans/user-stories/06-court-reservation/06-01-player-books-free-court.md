# US-06-01: Player Books Free Court

**Status:** Active  
**Domain:** 06-court-reservation  
**PRD Reference:** Section 7 Journey 2, Section 8.2  
**Supersedes:** US-03-01

---

## Story

As a **player**, I want to **book a free court slot** so that **I can reserve court time without any payment**.

---

## Context

This story covers the simplest reservation path: booking a slot that has no price (priceCents = NULL). The reservation is immediately confirmed upon creation.

**Previous context:** See `03-court-reservation/03-01-player-books-free-court.md` for original story.

---

## Acceptance Criteria

### Discover Free Slots

- Given I am on a court detail page (`/courts/[id]`)
- When the court has available slots with no price
- Then I see time slots with "Free" badge
- And slots show start time, end time, duration

### Select Slot

- Given I am viewing available slots
- When I click on an available free slot
- Then I am taken to the booking confirmation page
- Or a booking modal opens (depending on UI)

### Authentication Required

- Given I am NOT authenticated
- When I attempt to book a slot
- Then I am redirected to `/login?redirect=/courts/[id]`
- And after login, I return to the court page

### Profile Requirements

- Given I am authenticated
- When I attempt to confirm a booking
- Then the system checks for minimum profile (displayName + email or phone)
- If incomplete, I am prompted to complete profile first

### Confirm Booking

- Given I am authenticated with complete profile
- When I click "Reserve" or "Confirm Booking"
- Then a reservation is created via `reservation.create({ timeSlotId })`
- And reservation status is immediately `CONFIRMED`
- And slot status changes to `BOOKED`
- And I see a success message

### View Confirmation

- Given my booking is confirmed
- When I view the confirmation
- Then I see:
  - Court name and address
  - Date and time of slot
  - "Confirmed" status badge
  - Option to view in "My Reservations"

### Slot No Longer Available

- Given I am on the booking page
- When another player books the same slot before I confirm
- Then I see error: "This slot is no longer available"
- And I am redirected back to court detail to select another slot

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Slot booked by another | Error toast, refresh availability |
| Profile incomplete | Prompt to add displayName + contact |
| Court deactivated | Error, redirect to `/courts` |
| Network error | Error toast with retry option |
| Double-click reserve | Prevent duplicate submissions |

---

## User Flow

```
/courts (discovery)
        │
        ▼
/courts/[id] (court detail)
        │
        ├── View available free slots
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
        ▼
Success → /reservations/[id] (confirmation)
        │
        ▼
Optional: /reservations (my reservations list)
```

---

## API Integration

### Create Reservation

**Endpoint:** `reservation.create`

**Input:**
```typescript
{
  timeSlotId: string  // UUID of the slot
}
```

**Response (Free Court):**
```typescript
{
  id: string,
  status: "CONFIRMED",
  timeSlotId: string,
  playerId: string,
  // ... other fields
}
```

**Behavior:**
- Backend detects slot has no price → immediate CONFIRMED
- Slot status updated to BOOKED
- Player snapshot captured (name, email, phone)
- Reservation event logged

### Frontend Hook

**File:** `src/features/reservation/hooks/use-create-reservation.ts`

**Status:** Already connected to `trpc.reservation.create`

```typescript
export function useCreateReservation() {
  // Already implemented and connected
  return useMutation(trpc.reservation.create.mutationOptions({
    onSuccess: (data) => {
      // Handle success - redirect to confirmation
    }
  }));
}
```

---

## UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Court Detail | `/courts/[id]` | Shows slots, initiates booking |
| Slot List | Discovery feature | Displays available slots |
| Booking Page | `/courts/[id]/book/[slotId]` | Confirm reservation |
| Confirmation | `/reservations/[id]` | Show booking details |

---

## Player Snapshot

Per PRD Section 8.5, when reservation is created:

| Field | Source |
|-------|--------|
| playerNameSnapshot | Player profile displayName |
| playerEmailSnapshot | Player profile email |
| playerPhoneSnapshot | Player profile phone |

This ensures historical accuracy even if player updates profile later.

---

## Testing Checklist

- [ ] Discover free slots on court detail page
- [ ] "Free" badge displays correctly
- [ ] Click slot navigates to booking page
- [ ] Unauthenticated user redirected to login
- [ ] Login redirects back to court
- [ ] Incomplete profile prompts completion
- [ ] Reserve button creates reservation
- [ ] Reservation status is CONFIRMED
- [ ] Slot status changes to BOOKED
- [ ] Success message displays
- [ ] Confirmation page shows correct details
- [ ] Race condition handled (slot taken)
- [ ] Reservation appears in "My Reservations"

---

## References

- PRD: Section 7 Journey 2 (Free Court Booking)
- PRD: Section 8.2 (Free Court Lifecycle)
- Original: `03-court-reservation/03-01-player-books-free-court.md`
- Hook: `src/features/reservation/hooks/use-create-reservation.ts`
