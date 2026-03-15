# US-05-01: Owner Creates Time Slots

**Status:** Active  
**Domain:** 05-availability-management  
**PRD Reference:** Section 9 (Time Slot Management), Journey 5

---

## Story

As an **organization owner**, I want to **create time slots for my courts** so that **players can discover and book availability**.

---

## Acceptance Criteria

### Access Slot Management

- Given I am an owner with at least one court
- When I navigate to `/owner/courts/[id]/slots`
- Then I see the slot management page with calendar and slot list

### Create Single Slot

- Given I am on the slots page
- When I click "Add Slot" and enter start time, end time, and optional price
- Then a single slot is created with status `AVAILABLE`
- And the slot appears in the list immediately

### Create Bulk Slots

- Given I am on the slots page
- When I click "Add Slots" and configure:
  - Start date (required)
  - End date (optional, for recurring)
  - Days of week (for recurring)
  - Time range (start time, end time)
  - Duration per slot (e.g., 60 min)
  - Price (optional, NULL = free)
- Then multiple slots are created based on the configuration
- And I see a preview before confirming
- And a success toast shows "Created X slots successfully"

### Set Pricing

- Given I am creating slot(s)
- When I set a price (priceCents > 0) and currency
- Then the slot(s) are created as paid slots
- When I leave price empty or set to 0
- Then the slot(s) are created as free slots (priceCents = NULL)

### Overlap Validation

- Given I am creating a slot
- When the time range overlaps with an existing slot for the same court
- Then the creation fails with error "Time slot overlaps with existing slot"
- And the error clearly indicates which slot(s) conflict

### Post-Creation State

- Given I successfully create slot(s)
- When the operation completes
- Then I remain on the slots page
- And the slot list refreshes to show new slots
- And I can immediately create more slots

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| End time before start time | Validation error: "End time must be after start time" |
| Overlap with existing slot | Error toast with conflict details |
| Overlap within bulk creation | Error: slots in same batch conflict |
| Negative price | Validation error: "Price must be 0 or greater" |
| Price without currency | Validation error: "Currency required when price is set" |
| Court not found | 404 redirect |
| Not court owner | Forbidden error, redirect to `/owner/courts` |
| Network error | Error toast with retry option, preserve form state |

---

## UI Components

| Component | File | Purpose |
|-----------|------|---------|
| BulkSlotModal | `src/features/owner/components/bulk-slot-modal.tsx` | Modal for single/bulk slot creation |
| SlotList | `src/features/owner/components/slot-list.tsx` | Displays slots, has "Add Slot" button |

---

## Frontend Changes

### Hook: `useCreateBulkSlots`

**File:** `src/features/owner/hooks/use-slots.ts`

**Current:** Returns mock data with `setTimeout`

**Change:** Wire to `trpc.timeSlot.createBulk`

```typescript
// Transform BulkSlotData to CreateBulkTimeSlotsDTO
export function useCreateBulkSlots() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.timeSlot.createBulk.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "slots"] });
    },
  });
}
```

**Data Transformation:**
- `BulkSlotData` (frontend) → `CreateBulkTimeSlotsDTO` (backend)
- Generate slot array from date range, days of week, time range, duration
- Convert price to cents if provided

### Single Slot Creation

If single slot creation is needed separately from bulk:
- Wire `trpc.timeSlot.create` 
- Or use `createBulk` with single-item array

---

## Backend Endpoints

| Endpoint | Method | Input | Notes |
|----------|--------|-------|-------|
| `timeSlot.create` | Mutation | `{ courtId, startTime, endTime, priceCents?, currency? }` | Single slot |
| `timeSlot.createBulk` | Mutation | `{ courtId, slots: [...] }` | Max 100 slots per call |

**Backend is complete** - no changes needed, just wire frontend.

---

## Validation Rules

Per PRD Section 9:

| Rule | Validation |
|------|------------|
| Start/End | End must be after start |
| Overlap | No overlapping slots for same court |
| Price/Currency | Both required together, or both NULL |
| Bulk limit | Max 100 slots per createBulk call |

---

## Testing Checklist

- [ ] Create single free slot
- [ ] Create single paid slot
- [ ] Create bulk slots (single day)
- [ ] Create recurring slots (multiple days)
- [ ] Overlap detection works
- [ ] Price validation works
- [ ] Success toast appears
- [ ] Slot list refreshes after creation
- [ ] Error handling for network failures

---

## References

- PRD: Section 9 (Time Slot Management)
- PRD: Journey 5 (Owner Manages Availability)
- Existing UI: `src/features/owner/components/bulk-slot-modal.tsx`
- Backend: `src/modules/time-slot/time-slot.router.ts`
