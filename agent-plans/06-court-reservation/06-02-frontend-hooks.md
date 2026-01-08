# Phase 2: Frontend Hooks

**Module IDs:** 2A, 2B  
**Estimated Time:** 2 hours  
**Dependencies:** Phase 1 (Backend Verification)

---

## Objective

Verify existing hooks work and create any missing hooks for the reservation flow.

---

## Module 2A: Verify `useCreateReservation`

**File:** `src/features/reservation/hooks/use-create-reservation.ts`

### Current Implementation

```typescript
export function useCreateReservation() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.reservation.create.mutationOptions({
      onSuccess: (data) => {
        const requiresPayment = data.status === "AWAITING_PAYMENT";
        toast.success(
          requiresPayment
            ? "Reservation created! Please complete payment."
            : "Reservation confirmed!",
        );
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
        queryClient.invalidateQueries({ queryKey: ["courts"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create reservation");
      },
    }),
  );
}
```

### Verification Checklist

- [ ] Hook is exported from `src/features/reservation/hooks/index.ts`
- [ ] Works with real `timeSlotId` input
- [ ] Returns reservation data with correct status
- [ ] Toast shows appropriate message (free vs paid)
- [ ] Cache invalidation triggers refresh

### Test

```typescript
// In a component
const createReservation = useCreateReservation();

// Call
createReservation.mutate({ timeSlotId: "slot-uuid" }, {
  onSuccess: (data) => {
    if (data.status === "AWAITING_PAYMENT") {
      router.push(`/reservations/${data.id}/payment`);
    } else {
      router.push(`/reservations/${data.id}`);
    }
  }
});
```

---

## Module 2B: Add/Verify `useMarkPayment`

**File:** `src/features/reservation/hooks/use-mark-payment.ts` (create if needed)

### Check if Exists

```bash
# Search for existing hook
grep -r "useMarkPayment" src/features/
```

### Implementation (if needed)

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

interface MarkPaymentInput {
  reservationId: string;
  termsAccepted: true; // Must be true
}

/**
 * Hook to mark a reservation's payment as complete
 * Transitions status from AWAITING_PAYMENT to PAYMENT_MARKED_BY_USER
 */
export function useMarkPayment() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    ...trpc.reservation.markPayment.mutationOptions(),
    onSuccess: () => {
      toast.success("Payment marked! Awaiting owner confirmation.");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark payment");
    },
  });
}
```

### Export from Index

**File:** `src/features/reservation/hooks/index.ts`

Add:
```typescript
export * from "./use-mark-payment";
```

---

## Additional Hooks to Verify

### `useReservation` (get single reservation)

**File:** `src/features/reservation/hooks/use-reservation.ts`

Check if exists and works:
```typescript
export function useReservation(reservationId: string) {
  const trpc = useTRPC();
  
  return useQuery({
    ...trpc.reservation.getById.queryOptions({ reservationId }),
    enabled: !!reservationId,
  });
}
```

### `useMyReservations` (list player's reservations)

**File:** `src/features/reservation/hooks/use-my-reservations.ts`

Verify hook works and returns data for `/reservations` page.

---

## Hook Summary

| Hook | File | Status | Action |
|------|------|--------|--------|
| `useCreateReservation` | `use-create-reservation.ts` | Exists | Verify |
| `useMarkPayment` | `use-mark-payment.ts` | Check | Create if missing |
| `useReservation` | `use-reservation.ts` | Check | Verify or create |
| `useMyReservations` | `use-my-reservations.ts` | Exists | Verify |
| `useCancelReservation` | `use-cancel-reservation.ts` | Exists | Verify (for future) |

---

## Type Definitions

### Reservation Response Type

```typescript
interface Reservation {
  id: string;
  status: 
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED";
  timeSlotId: string;
  playerId: string;
  playerNameSnapshot: string | null;
  playerEmailSnapshot: string | null;
  playerPhoneSnapshot: string | null;
  cancellationReason: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Status Helper

```typescript
type ReservationDisplayStatus = 
  | "pending"      // AWAITING_PAYMENT, PAYMENT_MARKED_BY_USER
  | "confirmed"    // CONFIRMED
  | "cancelled"    // CANCELLED, EXPIRED
  ;

function mapReservationStatus(status: string): ReservationDisplayStatus {
  switch (status) {
    case "AWAITING_PAYMENT":
    case "PAYMENT_MARKED_BY_USER":
      return "pending";
    case "CONFIRMED":
      return "confirmed";
    case "CANCELLED":
    case "EXPIRED":
      return "cancelled";
    default:
      return "pending";
  }
}
```

---

## Error Handling

### Common Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| `SlotNotAvailableError` | Slot already booked | "This slot is no longer available" |
| `ProfileIncompleteError` | Missing profile data | "Please complete your profile first" |
| `TermsNotAcceptedError` | termsAccepted false | "You must accept the terms" |
| `ReservationNotFoundError` | Invalid ID | "Reservation not found" |

### Error Display

```typescript
onError: (error) => {
  // Parse error type if possible
  const message = error.message || "Something went wrong";
  
  if (message.includes("not available")) {
    toast.error("This slot has already been booked. Please choose another.");
  } else if (message.includes("profile")) {
    toast.error("Please complete your profile before booking.");
  } else {
    toast.error(message);
  }
}
```

---

## Testing Checklist

### `useCreateReservation`
- [ ] Creates reservation for free slot
- [ ] Creates reservation for paid slot
- [ ] Shows correct toast message
- [ ] Invalidates cache

### `useMarkPayment`
- [ ] Transitions AWAITING_PAYMENT → PAYMENT_MARKED_BY_USER
- [ ] Shows success toast
- [ ] Handles error gracefully

### `useReservation`
- [ ] Fetches single reservation
- [ ] Returns all fields
- [ ] Handles not found

### `useMyReservations`
- [ ] Lists player's reservations
- [ ] Filters by status work
- [ ] Pagination works

---

## Final Checklist

- [ ] All hooks exported from index
- [ ] All hooks use correct tRPC endpoints
- [ ] Error handling in place
- [ ] Toast notifications appropriate
- [ ] Cache invalidation correct
- [ ] TypeScript types match backend
- [ ] No console errors
