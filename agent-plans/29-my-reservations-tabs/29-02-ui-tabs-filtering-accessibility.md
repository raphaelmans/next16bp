# Phase 2: UI — Tabs, Filtering, Accessibility

**Dependencies:** Phase 1 complete  
**Parallelizable:** No  
**User Story:** `agent-plans/user-stories/06-court-reservation/06-04-player-views-my-reservations-tabs.md`

---

## Objective

Update the player reservations UI so that:

- Tabs have actual panels (`TabsContent`) to satisfy Radix ARIA contracts.
- Upcoming/Past/Cancelled are filtered using reserved slot time.
- List items render the correct reserved date/time.

---

## UI Changes

### Data hook

- Update `src/features/reservation/hooks/use-my-reservations.ts` to query `reservation.getMyWithDetails`.
- Map the enriched response into the existing `ReservationListItem` UI shape.
- Ensure comparisons use `slotEndTime >= now` for Upcoming.

### Tabs + Page integration

- Change `/reservations` page structure so the list is rendered inside `TabsContent` for each tab.
- Keep `?tab=` URL state via `nuqs`.

### Accessible counts

- Ensure screen readers get the count as part of the accessible label (e.g. “Past, 2”).
- Keep visual badge for sighted users.

---

## Validation Checklist

- [ ] No `aria-controls` references a missing element in `/reservations`.
- [ ] Upcoming shows future + in-progress reservations by reserved time.
- [ ] Past shows CONFIRMED reservations that ended.
- [ ] Cancelled aggregates CANCELLED + EXPIRED.
- [ ] Badge counts match the list content.
