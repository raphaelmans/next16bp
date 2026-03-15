# US-08-01-01: Payment Page - TTL Countdown Timer

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**Parent:** US-08-01 (Player Completes P2P Payment Flow)  
**PRD Reference:** Section 8.4 (TTL Rules)

---

## Story

As a **player**, I want to **see a countdown timer on the payment page** so that **I know how much time I have to complete my payment before the reservation expires**.

---

## Context

Per PRD Section 8.4, paid reservations have a 15-minute payment window. The backend already sets `expiresAt` when creating paid reservations. This story adds the frontend countdown display.

**Backend Already Implemented:**
- `expiresAt` set in `create-paid-reservation.use-case.ts`
- Cron job expires reservations at `/api/cron/expire-reservations`
- `reservation.getById` returns `expiresAt` field

---

## Acceptance Criteria

### Display Countdown

- Given my reservation is in `AWAITING_PAYMENT` status
- When I view the payment page
- Then I see a countdown timer showing remaining time (e.g., "12:34 remaining")
- And the timer updates every second

### Warning State

- Given the timer has less than 5 minutes remaining
- Then the timer displays in warning color (orange/destructive)
- And a warning message appears: "Time running out!"

### Expired State

- Given the timer reaches zero
- Then I see "Reservation expired" message
- And the "I Have Paid" button is disabled
- And I see option to "Book Again"

### No Timer for Already Marked

- Given my reservation is in `PAYMENT_MARKED_BY_USER` status
- When I view the payment page
- Then no countdown timer is shown
- And I see "Awaiting owner confirmation" instead

### Page Load After Expiration

- Given my reservation has already expired (`expiresAt` in past)
- When I navigate to the payment page
- Then I immediately see "Reservation expired" message
- And I cannot mark payment

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Page loaded after expiration | Show "Reservation expired" immediately |
| Timer expires while on page | Disable submit, show expiration message |
| User navigates away and back | Timer continues from correct remaining time |
| Network issues | Timer continues (client-side) |
| Very short time remaining (< 10s) | Show seconds countdown prominently |
| No `expiresAt` set (free court edge case) | No timer shown |

---

## UI Layout

### Timer in Payment Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Complete Your Payment                                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ⏱️  12:34 remaining                                      │  │
│  │      Time left to complete your payment                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ... rest of payment page ...                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Warning State (< 5 min)

```
┌───────────────────────────────────────────────────────────────┐
│  ⚠️  04:23 remaining                                          │
│      Time running out! Complete your payment soon.            │
└───────────────────────────────────────────────────────────────┘
```

### Expired State

```
┌───────────────────────────────────────────────────────────────┐
│  ❌  Reservation Expired                                       │
│      The 15-minute payment window has passed.                  │
│                                                                │
│      [Book Again]                                              │
└───────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Data Source

The `expiresAt` field is already returned from `reservation.getById`:

```typescript
// Current response includes:
{
  id: string,
  status: "AWAITING_PAYMENT",
  expiresAt: "2025-01-10T14:15:00.000Z", // ISO string
  timeSlotId: string,
  // ...
}
```

### Component Implementation

```typescript
// src/features/reservation/components/countdown-timer.tsx
interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    const calculateRemaining = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        setIsExpired(true);
        onExpire?.();
        return false;
      }
      setRemaining(diff);
      return true;
    };
    
    // Initial calculation
    if (!calculateRemaining()) return;
    
    // Update every second
    const interval = setInterval(() => {
      if (!calculateRemaining()) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isWarning = remaining > 0 && remaining < 5 * 60 * 1000;
  
  if (isExpired) {
    return <ExpiredMessage />;
  }
  
  return (
    <div className={cn(
      "flex items-center gap-2 p-4 rounded-lg",
      isWarning ? "bg-destructive/10 text-destructive" : "bg-muted"
    )}>
      <Clock className="h-5 w-5" />
      <div>
        <span className="font-mono font-semibold">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
        <span className="ml-2">remaining</span>
        {isWarning && (
          <p className="text-sm mt-1">Time running out!</p>
        )}
      </div>
    </div>
  );
}
```

### Integration in Payment Page

```typescript
// In src/app/(auth)/reservations/[id]/payment/page.tsx
const [isExpired, setIsExpired] = useState(false);

// Check initial expiration
useEffect(() => {
  if (reservation?.expiresAt && new Date(reservation.expiresAt) < new Date()) {
    setIsExpired(true);
  }
}, [reservation?.expiresAt]);

// In JSX:
{reservation?.expiresAt && reservation.status === "AWAITING_PAYMENT" && (
  <CountdownTimer 
    expiresAt={reservation.expiresAt} 
    onExpire={() => setIsExpired(true)}
  />
)}

// Disable button when expired
<Button
  onClick={handleMarkPaid}
  disabled={isExpired || markPayment.isPending}
>
  I Have Paid
</Button>
```

---

## Testing Checklist

- [ ] Timer displays correct remaining time
- [ ] Timer updates every second
- [ ] Timer format is MM:SS
- [ ] Warning state at < 5 minutes (orange styling)
- [ ] Warning message appears
- [ ] Expired state at 0 (shows expired message)
- [ ] "I Have Paid" button disabled when expired
- [ ] "Book Again" button navigates to court page
- [ ] No timer shown for `PAYMENT_MARKED_BY_USER` status
- [ ] Timer handles page refresh correctly
- [ ] Initial expiration check on page load
- [ ] Works correctly across timezone

---

## Dependencies

- `reservation.expiresAt` field (already exists)
- `reservation.getById` returns `expiresAt` (already returns it)
