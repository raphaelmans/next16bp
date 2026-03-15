**Status:** Active  
**Domain:** 06-court-reservation  
**PRD Reference:** Section 7 (Player journeys), "My Reservations" management  
**Supersedes:** -

---

## Story

As a **player**, I want to **view my reservations split into Upcoming, Pending, Past, and Cancelled** so that **I can quickly see what I need to attend, complete, or review**.

---

## Context

The current "Upcoming" bucketing logic includes non-cancelled reservations that haven't reached a final confirmed state (e.g. `CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`). This makes "Upcoming" misleading and inflates counts.

This story standardizes the "My Reservations" experience around the reserved slot time:

- **Pending:** reservations that are not yet confirmed (awaiting acceptance, awaiting payment, payment awaiting verification)
- **Upcoming:** confirmed reservations that are future + in-progress (based on `slotEndTime >= now`)
- **Past:** confirmed reservations that already ended (based on `slotEndTime < now`)
- **Cancelled:** cancelled or expired reservations

---

## Acceptance Criteria

### Tabs + Accessibility

- Given I am on `/reservations`
- When the tabs render
- Then I see four tabs: **Upcoming**, **Pending**, **Past**, **Cancelled**
- And each tab trigger has a corresponding tab panel
- And screen readers announce the tab label including the count (e.g., “Pending, 2”)

### Pending Bucket

- Given I have reservations with status `CREATED`, `AWAITING_PAYMENT`, or `PAYMENT_MARKED_BY_USER`
- When I view the "Pending" tab
- Then I see those reservations
- And those reservations do not appear in "Upcoming"

### Upcoming Uses Reserved Time

- Given I have confirmed reservations with slot start/end times
- When I view the "Upcoming" tab
- Then I see reservations where `status = CONFIRMED` whose **reserved end time** is greater than or equal to now
- And pending reservations do not appear in Upcoming
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
- Then the badge count matches the number of items shown for that tab (using the same bucketing rules)

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Slot times are missing or invalid | Filtering does not crash; confirmed reservations with unknown end time appear in Upcoming (not Past) |
| Reservation spans multiple time slots | Reserved time uses min(start) and max(end) across linked slots |
| Pending reservation slot time already passed | Still appears in Pending until it becomes Cancelled/Expired or Confirmed |
| Timezone differences | Comparisons are correct when server/runtime is in UTC |

---

## References

- UI: `src/app/(auth)/reservations/page.tsx`
- Tabs: `src/features/reservation/components/reservation-tabs.tsx`
- List: `src/features/reservation/components/reservation-list.tsx`
- Data hook: `src/features/reservation/hooks.ts`
- Backend query: `src/lib/modules/reservation/reservation.router.ts` → `reservation.getMyWithDetails`
