**Status:** Active  
**Domain:** 06-court-reservation  
**PRD Reference:** Section 7 (Player journeys), "My Reservations" management  
**Supersedes:** -

---

## Story

As a **player**, I want to **view my reservations split into Upcoming, Past, and Cancelled** so that **I can quickly understand what I still need to attend or act on**.

---

## Context

The current UI renders tab triggers but no tab panels, which leads to broken `aria-controls` references. The list filtering is also status-based and uses `createdAt` as a placeholder for the reserved date/time, so the "Upcoming" tab does not actually reflect the reservation’s scheduled slot.

This story standardizes the "My Reservations" experience around the reserved slot time:

- **Upcoming:** future + in-progress reservations (based on `slotEndTime >= now`)
- **Past:** completed reservations that ended (based on `slotEndTime < now`)
- **Cancelled:** cancelled or expired reservations

---

## Acceptance Criteria

### Tabs + Accessibility

- Given I am on `/reservations`
- When the tabs render
- Then each tab trigger has a corresponding tab panel
- And `aria-controls` on each trigger points to an existing panel element
- And screen readers announce the tab label including the count (e.g., “Past, 2”)

### Upcoming Uses Reserved Time

- Given I have reservations with slot start/end times
- When I view the "Upcoming" tab
- Then I see reservations whose **reserved end time** is greater than or equal to now
- And cancelled/expired reservations do not appear in Upcoming

### Past Uses Reserved Time

- Given I have confirmed reservations that already ended
- When I view the "Past" tab
- Then I see reservations where `status = CONFIRMED` and reserved end time is less than now

### Cancelled Aggregates Cancelled + Expired

- Given I have cancelled or expired reservations
- When I view the "Cancelled" tab
- Then I see reservations where status is `CANCELLED` or `EXPIRED`

### List Item Shows Reserved Date/Time

- Given I have any reservation in any tab
- When I view the reservation list
- Then each item shows the reserved date and time range derived from the reservation’s slot start/end times (not from `createdAt`)

### Counts Match Lists

- Given the tab badge count is displayed
- When I switch tabs
- Then the badge count matches the number of items shown for that tab

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Slot times are missing for a reservation | Fallback UI state; reservation still renders but does not break filtering logic |
| Reservation spans multiple time slots | Reserved time uses min(start) and max(end) across linked slots |
| Timezone differences | Comparisons are correct when server/runtime is in UTC |

---

## References

- UI: `src/app/(auth)/reservations/page.tsx`
- Tabs: `src/features/reservation/components/reservation-tabs.tsx`
- Data hook: `src/features/reservation/hooks/use-my-reservations.ts`
- Backend query: `src/modules/reservation/reservation.router.ts` → `reservation.getMy`
