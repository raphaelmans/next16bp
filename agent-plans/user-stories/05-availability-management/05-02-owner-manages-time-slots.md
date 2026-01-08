# US-05-02: Owner Views and Manages Time Slots

**Status:** Active  
**Domain:** 05-availability-management  
**PRD Reference:** Section 9 (Time Slot Management), Journey 5

---

## Story

As an **organization owner**, I want to **view and manage my court's time slots** so that **I can control availability and see who has booked**.

---

## Acceptance Criteria

### View All Slots for Date

- Given I am on `/owner/courts/[id]/slots`
- When I select a date from the calendar
- Then I see all slots for that date regardless of status
- And slots are ordered by start time

### Status Display

- Given I am viewing the slot list
- When a slot has status AVAILABLE
- Then it shows with "Available" badge (green)
- When status is HELD
- Then it shows with "Pending" badge (yellow) + player info
- When status is BOOKED
- Then it shows with "Booked" badge (blue) + player info
- When status is BLOCKED
- Then it shows with "Blocked" badge (gray)

### Player Info on Booked Slots

- Given a slot has status HELD or BOOKED
- When I view the slot
- Then I see:
  - Player name (from `playerNameSnapshot`)
  - Player phone (from `playerPhoneSnapshot`)
- And this info helps me identify who booked

### Calendar Navigation

- Given I am on the slots page
- When I navigate the calendar
- Then dates with existing slots show visual indicators (dots)
- And I can quickly jump to dates with slots

### Block Available Slot

- Given a slot has status AVAILABLE
- When I click "Block" from the slot actions menu
- Then the slot status changes to BLOCKED
- And a success toast confirms "Slot blocked"
- And the slot is no longer bookable by players

### Unblock Blocked Slot

- Given a slot has status BLOCKED
- When I click "Unblock" from the slot actions menu
- Then the slot status changes to AVAILABLE
- And a success toast confirms "Slot unblocked"
- And the slot becomes bookable again

### Delete Available Slot

- Given a slot has status AVAILABLE
- When I click "Delete" from the slot actions menu
- Then I see a confirmation prompt
- When I confirm deletion
- Then the slot is removed permanently
- And a success toast confirms "Slot deleted"

### Cannot Delete Non-Available Slots

- Given a slot has status HELD, BOOKED, or BLOCKED
- When I view slot actions
- Then "Delete" is disabled or hidden
- And tooltip explains "Only available slots can be deleted"

### Real Court Data

- Given I am on the slots page
- When the page loads
- Then the header shows the actual court name (not mock data)
- And breadcrumb shows correct court name

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Block non-available slot | Error: "Only available slots can be blocked" |
| Unblock non-blocked slot | Error: "Slot is not blocked" |
| Delete booked slot | Action disabled, slot protected |
| No slots for date | Empty state: "No slots for this date. Add slots to get started." |
| Court not found | 404 redirect |
| Not court owner | Forbidden error |
| Network error | Error toast with retry |

---

## UI Components

| Component | File | Purpose |
|-----------|------|---------|
| SlotList | `src/features/owner/components/slot-list.tsx` | Main slot display with stats |
| SlotItem | `src/features/owner/components/slot-item.tsx` | Individual slot row with actions |
| CalendarNavigation | `src/features/owner/components/calendar-navigation.tsx` | Date picker with indicators |

---

## Frontend Changes

### Hook: `useSlots`

**File:** `src/features/owner/hooks/use-slots.ts`

**Current:** Returns mock data via `generateMockSlots()`

**Change:** Wire to `trpc.timeSlot.getForCourt` (new endpoint)

```typescript
export function useSlots({ courtId, date }: UseSlotsOptions) {
  const trpc = useTRPC();
  
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  return useQuery({
    ...trpc.timeSlot.getForCourt.queryOptions({
      courtId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    enabled: !!courtId,
    select: (data) => mapBackendSlotsToFrontend(data),
  });
}
```

**Status Mapping:**
| Backend | Frontend |
|---------|----------|
| AVAILABLE | available |
| HELD | pending |
| BOOKED | booked |
| BLOCKED | blocked |

### Hook: `useBlockSlot`

**Current:** Mock with setTimeout

**Change:** Wire to `trpc.timeSlot.block`

```typescript
export function useBlockSlot() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.timeSlot.block.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "slots"] });
    },
  });
}
```

### Hook: `useUnblockSlot`

**Current:** Mock with setTimeout

**Change:** Wire to `trpc.timeSlot.unblock`

### Hook: `useDeleteSlot`

**Current:** Mock with setTimeout

**Change:** Wire to `trpc.timeSlot.delete`

### Page: Fetch Real Court Data

**File:** `src/app/(owner)/owner/courts/[id]/slots/page.tsx`

**Current:** Uses `mockCourt = { id: courtId, name: "Court A" }`

**Change:** Fetch real court via `trpc.courtManagement.getById` or similar

---

## Backend Requirements

### NEW: `timeSlot.getForCourt`

See `05-00-overview.md` for full specification.

**Key points:**
- Returns ALL slots for court (not just AVAILABLE)
- Includes player info for HELD/BOOKED slots
- Verifies owner has access to court

---

## Slot Actions by Status

| Status | Block | Unblock | Delete | View Player |
|--------|-------|---------|--------|-------------|
| AVAILABLE | Yes | - | Yes | - |
| HELD | - | - | - | Yes |
| BOOKED | - | - | - | Yes |
| BLOCKED | - | Yes | - | - |

---

## Data Structure

### Frontend TimeSlot Interface

```typescript
interface TimeSlot {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  durationMinutes: number;
  status: "available" | "booked" | "pending" | "blocked";
  priceCents?: number;
  currency?: string;
  // Player info (only for pending/booked)
  playerName?: string;
  playerPhone?: string;
}
```

---

## Testing Checklist

- [ ] View slots for a date (all statuses visible)
- [ ] Status badges display correctly
- [ ] Player info shows for HELD/BOOKED slots
- [ ] Calendar navigation works
- [ ] Dates with slots show indicators
- [ ] Block available slot
- [ ] Unblock blocked slot
- [ ] Delete available slot
- [ ] Delete disabled for non-available slots
- [ ] Real court name displays
- [ ] Empty state when no slots
- [ ] Error handling for all actions

---

## Deferred

The following are **not** part of this story:

- Confirm/Reject booking actions → See `07-owner-confirmation`
- Payment proof display → See `08-p2p-reservation-confirmation`

---

## References

- PRD: Section 9.3 (Time Slot Statuses)
- PRD: Section 9.4 (Status Transitions)
- Existing UI: `src/features/owner/components/slot-list.tsx`
- Backend: `src/modules/time-slot/`
