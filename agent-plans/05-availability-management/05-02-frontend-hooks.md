# Phase 2: Frontend Hook Wiring

**Module IDs:** 2A, 2B  
**Estimated Time:** 3 hours  
**Dependencies:** Phase 1 (Backend)

---

## Objective

Replace all mock implementations in `use-slots.ts` with real tRPC calls.

---

## File to Modify

**File:** `src/features/owner/hooks/use-slots.ts`

---

## Current State (Mock)

```typescript
// Mock data generator - TO BE REMOVED
const generateMockSlots = (date: Date): TimeSlot[] => { ... }

// All hooks return fake data with setTimeout delays
```

---

## Target State

### Step 1: Update Imports

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { startOfDay, endOfDay } from "date-fns";
```

### Step 2: Update Types

```typescript
export type SlotStatus = "available" | "booked" | "pending" | "blocked";

export interface TimeSlot {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  durationMinutes: number;
  status: SlotStatus;
  priceCents?: number | null;
  currency?: string | null;
  playerName?: string | null;
  playerPhone?: string | null;
}

interface UseSlotsOptions {
  courtId: string;
  date?: Date;
}
```

### Step 3: Status Mapping Utility

```typescript
/**
 * Map backend status (UPPERCASE) to frontend status (lowercase)
 */
function mapStatusFromBackend(
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED",
): SlotStatus {
  const map: Record<string, SlotStatus> = {
    AVAILABLE: "available",
    HELD: "pending",
    BOOKED: "booked",
    BLOCKED: "blocked",
  };
  return map[status] ?? "available";
}

/**
 * Calculate duration in minutes from start/end times
 */
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}
```

### Step 4: Replace `useSlots` Hook

```typescript
export function useSlots({ courtId, date }: UseSlotsOptions) {
  const trpc = useTRPC();

  const selectedDate = date ?? new Date();
  const startDate = startOfDay(selectedDate);
  const endDate = endOfDay(selectedDate);

  return useQuery({
    ...trpc.timeSlot.getForCourt.queryOptions({
      courtId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    enabled: !!courtId,
    select: (data): TimeSlot[] =>
      data.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: calculateDuration(
          slot.startTime as string,
          slot.endTime as string,
        ),
        status: mapStatusFromBackend(slot.status),
        priceCents: slot.priceCents,
        currency: slot.currency,
        playerName: slot.playerName,
        playerPhone: slot.playerPhone,
      })),
  });
}
```

### Step 5: Replace `useBlockSlot` Hook

```typescript
export function useBlockSlot() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.timeSlot.block.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlot"] });
    },
  });
}
```

### Step 6: Replace `useUnblockSlot` Hook

```typescript
export function useUnblockSlot() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.timeSlot.unblock.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlot"] });
    },
  });
}
```

### Step 7: Replace `useDeleteSlot` Hook

```typescript
export function useDeleteSlot() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.timeSlot.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlot"] });
    },
  });
}
```

### Step 8: Replace `useCreateBulkSlots` Hook

```typescript
export interface BulkSlotData {
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: number[];
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  duration: number;  // minutes
  useDefaultPrice: boolean;
  customPrice?: number;
  currency?: string;
}

/**
 * Generate slot array from bulk configuration
 */
function generateSlotsFromBulkData(
  courtId: string,
  data: BulkSlotData,
): Array<{
  startTime: string;
  endTime: string;
  priceCents: number | null;
  currency: string | null;
}> {
  const slots: Array<{
    startTime: string;
    endTime: string;
    priceCents: number | null;
    currency: string | null;
  }> = [];

  const startDateObj = new Date(data.startDate);
  const endDateObj = data.endDate ? new Date(data.endDate) : startDateObj;

  // Parse time strings
  const [startHour, startMin] = data.startTime.split(":").map(Number);
  const [endHour, endMin] = data.endTime.split(":").map(Number);

  // Iterate through dates
  const currentDate = new Date(startDateObj);
  while (currentDate <= endDateObj) {
    // Check if day of week matches (if specified)
    if (
      !data.daysOfWeek ||
      data.daysOfWeek.length === 0 ||
      data.daysOfWeek.includes(currentDate.getDay())
    ) {
      // Generate slots for this day
      let slotStart = new Date(currentDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMin, 0, 0);

      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + data.duration * 60000);
        if (slotEnd <= dayEnd) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            priceCents: data.useDefaultPrice
              ? null
              : data.customPrice
                ? Math.round(data.customPrice * 100)
                : null,
            currency: data.useDefaultPrice ? null : data.currency ?? null,
          });
        }
        slotStart = slotEnd;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}

export function useCreateBulkSlots(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkSlotData) => {
      const slots = generateSlotsFromBulkData(courtId, data);
      
      if (slots.length === 0) {
        throw new Error("No slots to create with the given configuration");
      }

      if (slots.length > 100) {
        throw new Error("Maximum 100 slots can be created at once");
      }

      return trpc.timeSlot.createBulk.mutate({
        courtId,
        slots,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["timeSlot"] });
      return { success: true, slotsCreated: data.length };
    },
  });
}
```

### Step 9: Keep Confirm/Reject as Placeholders (Deferred)

```typescript
// DEFERRED: These will be wired in 07-owner-confirmation
// They call reservation endpoints, not time-slot endpoints

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId }: { slotId: string }) => {
      // TODO: Wire to reservationOwner.confirmPayment
      // Need to get reservationId from slot context
      console.warn("useConfirmBooking not yet implemented - see US-07-02");
      throw new Error("Not implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlot"] });
    },
  });
}

export function useRejectBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      reason,
    }: {
      slotId: string;
      reason: string;
    }) => {
      // TODO: Wire to reservationOwner.reject
      // Need to get reservationId from slot context
      console.warn("useRejectBooking not yet implemented - see US-07-02");
      throw new Error("Not implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlot"] });
    },
  });
}
```

---

## Complete File

See the combined implementation above. The full file should:

1. Remove `generateMockSlots` function
2. Add status mapping utilities
3. Replace all 6 hooks with real implementations
4. Keep confirm/reject as placeholders with warnings

---

## Dependencies to Install

None - all dependencies already installed:
- `@tanstack/react-query`
- `date-fns`

---

## Testing

### Unit Tests (Optional)

```typescript
describe("useSlots", () => {
  it("should call getForCourt with correct date range", () => {
    // Mock trpc, render hook, verify call
  });

  it("should map statuses correctly", () => {
    // AVAILABLE -> available
    // HELD -> pending
    // BOOKED -> booked
    // BLOCKED -> blocked
  });
});

describe("useCreateBulkSlots", () => {
  it("should generate correct slots for single day", () => {
    // Input: single date, 6am-10am, 60 min duration
    // Output: 4 slots
  });

  it("should generate correct slots for date range", () => {
    // Input: 3 days, specific days of week
    // Output: filtered by day of week
  });
});
```

### Manual Testing

1. Navigate to `/owner/courts/[id]/slots`
2. Verify slots load from API (check network tab)
3. Test block action → verify slot status changes
4. Test unblock action → verify slot status changes
5. Test delete action → verify slot removed
6. Test bulk create → verify slots created

---

## Checklist

- [ ] Imports updated (add `useTRPC`, `date-fns`)
- [ ] Status mapping utility added
- [ ] `useSlots` wired to `getForCourt`
- [ ] `useBlockSlot` wired to `block`
- [ ] `useUnblockSlot` wired to `unblock`
- [ ] `useDeleteSlot` wired to `delete`
- [ ] `useCreateBulkSlots` wired to `createBulk`
- [ ] Slot generation logic handles date ranges
- [ ] Slot generation handles days of week filter
- [ ] Price conversion (dollars to cents) correct
- [ ] Cache invalidation on mutations
- [ ] Confirm/reject hooks have TODO warnings
- [ ] TypeScript compiles without errors
- [ ] No mock data remains
