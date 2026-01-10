# Phase 4: Expiration Handling

**Dependencies:** Phase 2 (Module 2A for countdown timer)  
**Parallelizable:** Yes (4A, 4B, 4C can run in parallel)  
**User Stories:** US-08-03-02

---

## Objective

Provide clear UI states for expired reservations across all views:
1. Payment page expired state
2. Reservation detail expired state
3. My Reservations list expired badge

---

## Module 4A: Expired UI Component

**User Story:** `US-08-03-02`  
**Priority:** High

### Files to Create

| File | Description |
|------|-------------|
| `src/features/reservation/components/reservation-expired.tsx` | Expired message |

### Component Implementation

```typescript
// src/features/reservation/components/reservation-expired.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import Link from "next/link";

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
            The 15-minute payment window has passed and this reservation is no
            longer valid.
          </p>

          {(courtName || slotDate) && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium mb-2">Your Requested Slot</p>
              {courtName && (
                <p className="text-sm text-muted-foreground">
                  Court: {courtName}
                </p>
              )}
              {slotDate && (
                <p className="text-sm text-muted-foreground">Date: {slotDate}</p>
              )}
              {slotTime && (
                <p className="text-sm text-muted-foreground">Time: {slotTime}</p>
              )}
              {amount && (
                <p className="text-sm text-muted-foreground">Amount: {amount}</p>
              )}
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

### Integration in Payment Page

```typescript
// In payment page, handle expired status:
if (reservation?.status === "EXPIRED" || isExpired) {
  return (
    <Container className="py-6">
      <ReservationExpired
        courtId={slot?.courtId}
        courtName={courtName}
        slotDate={slotDate}
        slotTime={slotTime}
        amount={price}
      />
    </Container>
  );
}
```

### Integration in Reservation Detail

```typescript
// In reservation detail page:
if (reservation.status === "EXPIRED") {
  return (
    <Container className="py-6">
      <ReservationExpired
        courtId={reservation.courtId}
        courtName={reservation.courtName}
        slotDate={formattedDate}
        slotTime={formattedTime}
        amount={formattedAmount}
      />
    </Container>
  );
}
```

### Testing Checklist

- [ ] Expired message displays
- [ ] Slot details shown
- [ ] "Book Again" navigates to court
- [ ] Works on payment page
- [ ] Works on detail page

---

## Module 4B: Status Badges

**User Story:** `US-08-03-02`  
**Priority:** Medium

### Files to Create/Update

| File | Action |
|------|--------|
| `src/features/reservation/utils/status-display.ts` | Create status config |
| `src/features/reservation/components/status-badge.tsx` | Create badge component |

### Status Configuration

```typescript
// src/features/reservation/utils/status-display.ts
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

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
    icon: AlertCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800",
    icon: XCircle,
  },
} as const;

export type ReservationStatus = keyof typeof statusConfig;

export function getStatusConfig(status: string) {
  return statusConfig[status as ReservationStatus] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
    icon: AlertCircle,
  };
}
```

### Badge Component

```typescript
// src/features/reservation/components/status-badge.tsx
import { getStatusConfig } from "../utils/status-display";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
```

### Testing Checklist

- [ ] All status badges display correctly
- [ ] Expired badge has muted styling
- [ ] Icons display for each status

---

## Module 4C: My Reservations List

**User Story:** `US-08-03-02`  
**Priority:** Medium

### Update Existing List

The My Reservations page should:
1. Use status badges for all reservations
2. Apply muted styling for expired reservations
3. Show expired reservations in the list (not hidden)

### Integration

```typescript
// In my reservations page/component:
import { StatusBadge } from "@/features/reservation/components/status-badge";

// In the reservation card:
<div className={cn(
  "border rounded-lg p-4",
  reservation.status === "EXPIRED" && "opacity-60"
)}>
  <div className="flex justify-between items-start">
    <div>
      <h3 className="font-medium">{reservation.courtName}</h3>
      <p className="text-sm text-muted-foreground">{reservation.slotTime}</p>
    </div>
    <StatusBadge status={reservation.status} />
  </div>
</div>
```

### Testing Checklist

- [ ] Expired reservations visible in list
- [ ] Expired have muted styling
- [ ] Status badge shows "Expired"
- [ ] Can click to view details

---

## Full Expired State Flow

```
Timer reaches 0 OR status is EXPIRED
            │
            ▼
┌─────────────────────────────────────┐
│     Expired State Shown             │
│     - Message explaining what       │
│       happened                      │
│     - "Book Again" button           │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│     My Reservations                 │
│     - Expired badge                 │
│     - Muted card styling            │
└─────────────────────────────────────┘
```

---

## Phase Completion Checklist

- [ ] Module 4A: Expired UI component
- [ ] Module 4B: Status badges with expired state
- [ ] Module 4C: My Reservations expired styling
- [ ] Payment page shows expired state
- [ ] Reservation detail shows expired state
- [ ] Timer expiration triggers UI update
- [ ] Build passes
- [ ] No TypeScript errors

---

## Handoff Notes

- Phase 4 completes the P2P reservation confirmation feature
- All expired states should be consistent across views
- "Book Again" should link to the court page (not slot, as slot is no longer available)
