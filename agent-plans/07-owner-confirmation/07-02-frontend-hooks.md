# Phase 2: Frontend Hooks

**Dependencies:** Phase 1 (Backend Enhancement) complete  
**Parallelizable:** No  
**User Stories:** US-07-01, US-07-02

---

## Objective

Update `useOwnerReservations` hook to map enriched backend data, removing placeholder values.

---

## Current State

**File:** `src/features/owner/hooks/use-owner-reservations.ts`

### Current Mapping (Lines 109-132)

```typescript
select: (data) => {
  let reservations: Reservation[] = data.map((r) => ({
    id: r.id,
    // These will be empty/placeholder until backend provides slot/court data
    courtId: "",
    courtName: "Court",                    // PLACEHOLDER
    playerName: r.playerNameSnapshot ?? "Unknown",
    playerEmail: r.playerEmailSnapshot ?? "",
    playerPhone: r.playerPhoneSnapshot ?? "",
    // Using createdAt as date for now since we don't have slot data
    date: r.createdAt
      ? new Date(r.createdAt).toISOString().split("T")[0]
      : "",
    startTime: "--:--",                    // PLACEHOLDER
    endTime: "--:--",                      // PLACEHOLDER
    amountCents: 0,                        // PLACEHOLDER
    currency: "PHP",
    status: mapStatusFromBackend(r.status),
    paymentReference: undefined,
    paymentProofUrl: undefined,
    notes: r.cancellationReason ?? undefined,
    createdAt: r.createdAt ?? "",
  }));
  // ...
}
```

### Current Interface (Lines 12-29)

```typescript
export interface Reservation {
  id: string;
  courtId: string;
  courtName: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  currency: string;
  status: ReservationStatus;
  paymentReference?: string;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
}
```

---

## Target State

### Updated Mapping

```typescript
select: (data) => {
  let reservations: Reservation[] = data.map((r) => ({
    id: r.id,
    courtId: r.courtId,                           // FROM BACKEND
    courtName: r.courtName,                       // FROM BACKEND
    playerName: r.playerNameSnapshot ?? "Unknown",
    playerEmail: r.playerEmailSnapshot ?? "",
    playerPhone: r.playerPhoneSnapshot ?? "",
    // Extract date from slotStartTime
    date: r.slotStartTime
      ? new Date(r.slotStartTime).toISOString().split("T")[0]
      : "",
    startTime: r.slotStartTime                    // FROM BACKEND
      ? formatTime(r.slotStartTime)
      : "--:--",
    endTime: r.slotEndTime                        // FROM BACKEND
      ? formatTime(r.slotEndTime)
      : "--:--",
    amountCents: r.amountCents ?? 0,              // FROM BACKEND
    currency: r.currency ?? "PHP",                // FROM BACKEND
    status: mapStatusFromBackend(r.status),
    paymentReference: undefined,
    paymentProofUrl: undefined,
    notes: r.cancellationReason ?? undefined,
    createdAt: r.createdAt ?? "",
  }));
  // ...
}
```

---

## Implementation Steps

### Step 1: Add Time Formatting Helper

Add at the top of the file (after imports):

```typescript
/**
 * Format ISO datetime string to time (e.g., "2:00 PM")
 */
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "--:--";
  }
}
```

### Step 2: Update Select Function

Replace the `select` function in `useOwnerReservations`:

```typescript
select: (data) => {
  // Map backend records to frontend Reservation format
  let reservations: Reservation[] = data.map((r) => ({
    id: r.id,
    courtId: r.courtId,
    courtName: r.courtName,
    playerName: r.playerNameSnapshot ?? "Unknown",
    playerEmail: r.playerEmailSnapshot ?? "",
    playerPhone: r.playerPhoneSnapshot ?? "",
    // Extract date from slotStartTime
    date: r.slotStartTime
      ? new Date(r.slotStartTime).toISOString().split("T")[0]
      : r.createdAt
        ? new Date(r.createdAt).toISOString().split("T")[0]
        : "",
    startTime: r.slotStartTime ? formatTime(r.slotStartTime) : "--:--",
    endTime: r.slotEndTime ? formatTime(r.slotEndTime) : "--:--",
    amountCents: r.amountCents ?? 0,
    currency: r.currency ?? "PHP",
    status: mapStatusFromBackend(r.status),
    paymentReference: undefined,
    paymentProofUrl: undefined,
    notes: r.cancellationReason ?? undefined,
    createdAt: r.createdAt ?? "",
  }));

  // Apply client-side search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    reservations = reservations.filter(
      (r) =>
        r.playerName.toLowerCase().includes(searchLower) ||
        r.playerEmail.toLowerCase().includes(searchLower) ||
        r.playerPhone.includes(search) ||
        r.courtName.toLowerCase().includes(searchLower),  // Also search by court name
    );
  }

  return reservations;
},
```

### Step 3: Update Comments

Remove outdated comments about placeholders:

```typescript
// Before:
// These will be empty/placeholder until backend provides slot/court data

// After:
// Enriched data from backend includes court/slot details
```

---

## Type Alignment

### Backend Response Type (from Phase 1)

```typescript
interface ReservationWithDetails {
  id: string;
  status: string;
  playerNameSnapshot: string | null;
  playerEmailSnapshot: string | null;
  playerPhoneSnapshot: string | null;
  cancellationReason: string | null;
  createdAt: string | null;
  courtId: string;
  courtName: string;
  slotStartTime: string;
  slotEndTime: string;
  amountCents: number | null;
  currency: string | null;
}
```

### Frontend Type (unchanged)

```typescript
interface Reservation {
  id: string;
  courtId: string;
  courtName: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  currency: string;
  status: ReservationStatus;
  paymentReference?: string;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
}
```

The mapping handles the transformation between these types.

---

## Full Updated File

**File:** `src/features/owner/hooks/use-owner-reservations.ts`

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Reservation {
  id: string;
  courtId: string;
  courtName: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  currency: string;
  status: ReservationStatus;
  paymentReference?: string;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
}

interface UseOwnerReservationsOptions {
  courtId?: string;
  status?: ReservationStatus | "all";
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Map frontend status to backend enum value
 */
function mapStatusToBackend(
  status?: ReservationStatus,
):
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | undefined {
  if (!status) return undefined;
  const map: Record<
    ReservationStatus,
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED"
  > = {
    pending: "PAYMENT_MARKED_BY_USER",
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    completed: "CONFIRMED",
  };
  return map[status];
}

/**
 * Map backend status to frontend status
 */
function mapStatusFromBackend(status: string): ReservationStatus {
  const map: Record<string, ReservationStatus> = {
    CREATED: "pending",
    AWAITING_PAYMENT: "pending",
    PAYMENT_MARKED_BY_USER: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    EXPIRED: "cancelled",
  };
  return map[status] ?? "pending";
}

/**
 * Format ISO datetime string to time (e.g., "2:00 PM")
 */
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "--:--";
  }
}

/**
 * Fetch reservations for an organization
 * Uses reservationOwner.getForOrganization endpoint
 *
 * Backend returns enriched data with court/slot details.
 */
export function useOwnerReservations(
  organizationId: string | null,
  options: UseOwnerReservationsOptions = {},
) {
  const trpc = useTRPC();
  const { courtId, status, search } = options;

  return useQuery({
    ...trpc.reservationOwner.getForOrganization.queryOptions({
      organizationId: organizationId!,
      courtId: courtId || undefined,
      status: status !== "all" ? mapStatusToBackend(status) : undefined,
      limit: 100,
      offset: 0,
    }),
    enabled: !!organizationId,
    select: (data) => {
      // Map backend records to frontend Reservation format
      let reservations: Reservation[] = data.map((r) => ({
        id: r.id,
        courtId: r.courtId,
        courtName: r.courtName,
        playerName: r.playerNameSnapshot ?? "Unknown",
        playerEmail: r.playerEmailSnapshot ?? "",
        playerPhone: r.playerPhoneSnapshot ?? "",
        // Extract date from slotStartTime
        date: r.slotStartTime
          ? new Date(r.slotStartTime).toISOString().split("T")[0]
          : r.createdAt
            ? new Date(r.createdAt).toISOString().split("T")[0]
            : "",
        startTime: r.slotStartTime ? formatTime(r.slotStartTime) : "--:--",
        endTime: r.slotEndTime ? formatTime(r.slotEndTime) : "--:--",
        amountCents: r.amountCents ?? 0,
        currency: r.currency ?? "PHP",
        status: mapStatusFromBackend(r.status),
        paymentReference: undefined,
        paymentProofUrl: undefined,
        notes: r.cancellationReason ?? undefined,
        createdAt: r.createdAt ?? "",
      }));

      // Apply client-side search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        reservations = reservations.filter(
          (r) =>
            r.playerName.toLowerCase().includes(searchLower) ||
            r.playerEmail.toLowerCase().includes(searchLower) ||
            r.playerPhone.includes(search) ||
            r.courtName.toLowerCase().includes(searchLower),
        );
      }

      return reservations;
    },
  });
}

// ... rest of file unchanged (useConfirmReservation, useRejectReservation, useReservationCounts)
```

---

## Testing Checklist

- [ ] Hook compiles without TypeScript errors
- [ ] Court name displays real value (not "Court")
- [ ] Start time displays formatted time (not "--:--")
- [ ] End time displays formatted time
- [ ] Amount displays actual value (not 0)
- [ ] Date extracted from slot start time
- [ ] Search by court name works
- [ ] Status filtering still works
- [ ] Confirm/reject mutations still work

---

## Files to Modify

| File | Change |
|------|--------|
| `src/features/owner/hooks/use-owner-reservations.ts` | Update select mapping, add formatTime helper |

---

## Handoff Notes

After completing Phase 2:
1. Run `npm run build` to verify no TypeScript errors
2. Test the reservations page visually
3. Proceed to Phase 3 (UI Integration)
