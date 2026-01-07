# US-03-01: Player Books Free Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player**, I want to **book a free court slot** so that **I can play pickleball without any payment required**.

---

## Acceptance Criteria

### View Availability

- Given I am on a court detail page (`/courts/[id]`)
- When the court has available free slots
- Then I see time slots displayed with "Free" badge

### Select Slot

- Given I am viewing available slots
- When I click an available free slot
- Then the booking modal/page opens showing slot details

### Confirm Booking (Authenticated)

- Given I am authenticated with complete profile
- When I click "Reserve" on a free slot
- Then the reservation is created with status `CONFIRMED`
- And the slot status changes to `BOOKED`
- And I see a success confirmation

### Guest Booking Redirect

- Given I am NOT authenticated
- When I click "Reserve" on any slot
- Then I am redirected to `/login?redirect=/courts/[id]/book/[slotId]`

### Profile Incomplete

- Given my profile is missing required fields (displayName, email or phone)
- When I try to confirm a booking
- Then I am prompted to complete minimum profile fields

### View Confirmation

- Given my booking is confirmed
- When I view the confirmation
- Then I see court name, date, time, and "Confirmed" status
- And I have option to view in "My Reservations"

---

## Edge Cases

- Slot booked by another user while viewing - Show error "Slot no longer available", refresh availability
- Profile incomplete - Show inline form to complete minimum fields
- Network error during booking - Show error toast with retry
- Court deactivated after viewing - Show error, redirect to `/courts`

---

## Booking Flow

```
/courts/[id]
    │
    ▼
Select free slot
    │
    ▼
/courts/[id]/book/[slotId]
    │
    ▼
[Reserve] ─── Creates reservation (CONFIRMED)
    │         Updates slot (BOOKED)
    ▼
Success confirmation
    │
    ▼
/reservations (optional)
```

---

## Minimum Profile for Booking

| Field | Required |
|-------|----------|
| Display Name | Yes |
| Email | Either email or phone |
| Phone | Either email or phone |

---

## API Endpoints

| Endpoint | Method | Input |
|----------|--------|-------|
| `reservation.create` | Mutation | `{ slotId }` |

---

## References

- PRD: Section 7 Journey 2 (Free Court Booking)
- PRD: Section 8.2 (Free Court Lifecycle)
- Design System: Section 5.4 (Time Slots)
