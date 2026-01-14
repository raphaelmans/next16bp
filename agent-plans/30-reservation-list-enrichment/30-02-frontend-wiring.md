# Phase 2: Frontend Wiring

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-16-01, US-16-02

---

## Objective

Switch player-facing reservation list and home summary to the enriched endpoint and remove placeholder data.

---

## Modules

### Module 2A: Reservation list hook + UI

**User Story:** `US-16-01`  
**Reference:** `30-02-frontend-wiring.md`

#### Directory Structure

```
src/features/reservation/
├── hooks/
│   └── use-my-reservations.ts
├── components/
│   └── reservation-list-item.tsx
```

#### Implementation Steps

1. Replace `reservation.getMy` usage with `reservation.getMyWithDetails`.
2. Map API fields to `ReservationListItem` shape (court, time slot, price).
3. Update cache invalidation hooks to invalidate `getMyWithDetails`.

#### Testing Checklist

- [ ] Reservation list renders without placeholder text.
- [ ] Status filters still behave as expected.

---

### Module 2B: Home summary wiring

**User Story:** `US-16-02`  
**Reference:** `30-02-frontend-wiring.md`

#### Directory Structure

```
src/features/home/
├── hooks/
│   └── use-home-data.ts
src/app/(auth)/home/page.tsx
```

#### Implementation Steps

1. Use `getMyWithDetails` for upcoming reservations query.
2. Map real court name/address and slot start times into `UpcomingReservations`.

#### Testing Checklist

- [ ] Upcoming reservations show real court names and dates.
- [ ] Empty state remains intact.

---

## Phase Completion Checklist

- [ ] Hooks updated to new endpoint
- [ ] Home page mapping uses real data
- [ ] Cache invalidation updated
