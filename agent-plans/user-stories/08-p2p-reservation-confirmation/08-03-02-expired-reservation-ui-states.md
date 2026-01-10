# US-08-03-02: Frontend - Expired Reservation UI States

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**Parent:** US-08-03 (TTL Expiration Handling)

---

## Story

As a **player**, I want to **see clear messaging when my reservation has expired** so that **I understand what happened and can book again**.

---

## Context

When a reservation expires (either by cron job or timer reaching zero), the frontend needs to display appropriate messaging across different views:
- Payment page
- Reservation detail page
- My Reservations list

---

## Acceptance Criteria

### Payment Page - Already Expired

- Given my reservation status is `EXPIRED`
- When I navigate to the payment page
- Then I see "Reservation Expired" message
- And the reason: "The 15-minute payment window has passed"
- And a button to "Book Again" linking to the court page

### Payment Page - Expires While Viewing

- Given my reservation timer reaches zero while on the page
- Then the page updates to show "Reservation Expired"
- And the "I Have Paid" button is disabled
- And I see option to book again

### My Reservations - Expired Status

- Given I have an expired reservation
- When I view "My Reservations" (`/reservations`)
- Then I see the reservation with "Expired" status badge
- And appropriate expired styling (gray/muted)

### Reservation Detail - Expired

- Given I view an expired reservation detail
- Then I see "Reservation Expired" heading
- And explanation of what happened
- And details of what court/time was requested
- And option to book a new slot

### Cannot Mark Payment on Expired

- Given my reservation is expired
- When I try to access the payment page
- Then I cannot submit the "I Have Paid" form
- And the button is disabled

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Timer expires while typing proof | Disable submit, show expired |
| Refresh payment page after expiry | Show expired state immediately |
| Deep link to expired payment page | Redirect or show expired |
| Expired reservation in list with others | Clearly distinguished visually |
| Very old expired reservation | Same treatment as recent expired |

---

## UI Layout

### Payment Page - Expired State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⛔ Reservation Expired                                         │
│                                                                 │
│  The 15-minute payment window has passed and this               │
│  reservation is no longer valid.                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Your Requested Slot                                       │  │
│  │                                                           │  │
│  │  Court: Court A at Sports Complex                          │  │
│  │  Date: January 10, 2025                                    │  │
│  │  Time: 2:00 PM - 3:00 PM                                   │  │
│  │  Amount: ₱200                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  The slot is now available for others to book.                  │
│  Would you like to try again?                                   │
│                                                                 │
│  [Book Again]                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### My Reservations - Expired Badge

```
┌─────────────────────────────────────────────────────────────────┐
│  My Reservations                                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Court A                                    [Confirmed] ✅  │  │
│  │  Jan 12, 2:00 PM - 3:00 PM                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Court B                                     [Expired] ⏱️  │  │
│  │  Jan 10, 2:00 PM - 3:00 PM                  (muted style) │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Reservation Detail - Expired

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to My Reservations                                      │
│                                                                 │
│  ⏱️ Expired                                                     │
│                                                                 │
│  This reservation expired on January 10, 2025 at 2:15 PM.       │
│  The payment window of 15 minutes was not completed.            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Court: Court A                                            │  │
│  │  Date: January 10, 2025                                    │  │
│  │  Time: 2:00 PM - 3:00 PM                                   │  │
│  │  Amount: ₱200                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Book This Court Again]                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Expired State Detection

```typescript
// In payment page or reservation components
const isExpired = reservation?.status === "EXPIRED" || 
  (reservation?.expiresAt && 
   reservation.status === "AWAITING_PAYMENT" &&
   new Date(reservation.expiresAt) < new Date());
```

### Expired Message Component

```typescript
// src/features/reservation/components/reservation-expired.tsx
interface ReservationExpiredProps {
  courtId?: string;
  courtName?: string;
  slotDate?: string;
  slotTime?: string;
  amount?: string;
}

export function ReservationExpired({
  courtId,
  courtName,
  slotDate,
  slotTime,
  amount,
}: ReservationExpiredProps) {
  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardContent className="p-6 text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <h2 className="font-heading font-semibold text-lg mb-2">
            Reservation Expired
          </h2>
          
          <p className="text-muted-foreground mb-6">
            The 15-minute payment window has passed and this 
            reservation is no longer valid.
          </p>
          
          {(courtName || slotDate) && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium mb-2">Your Requested Slot</p>
              {courtName && <p className="text-sm">Court: {courtName}</p>}
              {slotDate && <p className="text-sm">Date: {slotDate}</p>}
              {slotTime && <p className="text-sm">Time: {slotTime}</p>}
              {amount && <p className="text-sm">Amount: {amount}</p>}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mb-4">
            The slot is now available for others to book.
          </p>
          
          {courtId && (
            <Button asChild>
              <Link href={`/courts/${courtId}`}>Book Again</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Status Badge Colors

```typescript
// src/features/reservation/utils/status-display.ts
export const statusConfig = {
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    className: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  PAYMENT_MARKED_BY_USER: {
    label: "Pending Confirmation",
    className: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600",
    icon: Clock,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};
```

### Integration Points

1. **Payment Page** (`/reservations/[id]/payment`):
   - Check status on load
   - Handle timer expiration callback
   - Show `ReservationExpired` component

2. **Reservation Detail** (`/reservations/[id]`):
   - Show expired state for `EXPIRED` status
   - Include "Book Again" CTA

3. **My Reservations** (`/reservations`):
   - Use status badge with expired styling
   - Muted card appearance for expired

---

## Testing Checklist

- [ ] Payment page shows expired message for `EXPIRED` status
- [ ] Payment page shows expired when timer reaches zero
- [ ] "I Have Paid" button disabled when expired
- [ ] "Book Again" button navigates to court page
- [ ] My Reservations shows expired badge
- [ ] Expired reservations have muted styling
- [ ] Reservation detail shows expired state
- [ ] Expired detail includes original slot info
- [ ] Works correctly on page refresh
- [ ] Deep link to expired payment redirects appropriately

---

## Dependencies

- US-08-01-01 (Countdown timer, for expires-while-viewing)
- Status badge/display utilities
- Court ID available in reservation data (for "Book Again" link)
