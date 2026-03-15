# Phase 1: Backend Enrichment Endpoint

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-16-01, US-16-02

---

## Objective

Expose a player-scoped reservation list endpoint with joined court, place, photo, and slot pricing data.

---

## Modules

### Module 1A: Repository + DTOs

**User Story:** `US-16-01`  
**Reference:** `30-01-backend-list-endpoint.md`

#### Directory Structure

```
src/modules/reservation/
├── dtos/
│   └── reservation-list.dto.ts
├── repositories/
│   └── reservation.repository.ts
```

#### Implementation Steps

1. Add a reservation list DTO schema for player list items.
2. Implement a repository query joining reservation → time slot → court → place → place photos.
3. Aggregate start/end times and total price across linked slots.

#### Testing Checklist

- [ ] Repository query returns first place photo URL when available.
- [ ] Multi-slot reservations return earliest start and latest end.
- [ ] Price totals sum across linked slots.

---

### Module 1B: Service + Router Endpoint

**User Story:** `US-16-01`  
**Reference:** `30-01-backend-list-endpoint.md`

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `reservation.getMyWithDetails` | Query | `{ status?, upcoming?, limit, offset }` | `ReservationListItem[]` |

#### Implementation Steps

1. Add service method `getMyReservationsWithDetails`.
2. Wire `reservation.getMyWithDetails` to the service.
3. Keep existing `reservation.getMy` for legacy usage.

#### Testing Checklist

- [ ] Endpoint returns data for authenticated player only.
- [ ] Upcoming filter respects slot start times.

---

## Phase Completion Checklist

- [ ] DTO schema added and exported
- [ ] Repository join query implemented
- [ ] Service + router endpoint implemented
