# Phase 1: Refresh Controls + Activity Timeline

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** 06-court-reservation, 07-owner-confirmation

---

## Objective

Provide manual refresh buttons for player/owner reservation views and render a complete activity timeline sourced from reservation event logs.

---

## Modules

### Module 1A: Reservation events API

**User Story:** Player sees full reservation timeline  
**Reference:** `15-00-overview.md`

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `reservation.getById` | Query | `{ reservationId: string }` | `{ reservation, events[] }` |

#### Implementation Steps

1. Add a service method that returns reservation + event list (ordered by `createdAt`).
2. Update `reservation.router.ts` `getById` to return the new response shape.
3. Update any shared DTO/types to match new response shape.

#### Testing Checklist

- [ ] Ensure `reservation.getById` returns events in chronological order.

---

### Module 1B: Player/Owner UI refresh + timeline

**User Story:** Player/owner can refresh without reload  
**Reference:** `15-00-overview.md`

#### UI Layout

```
Page Header (Title + Refresh Button)

Activity Card
- Reservation requested
- Owner accepted
- Payment marked
- Owner confirmed
```

#### Implementation Steps

1. Player reservation detail page:
   - Add Refresh button via `PageHeader` actions.
   - Invalidate queries for reservation + dependent entities.
   - Replace Activity card with event-driven timeline.
2. Owner reservations list page:
   - Add Refresh button near title.
   - Invalidate reservations list + pending count.
3. Owner active reservations page:
   - Add Refresh button near header.
   - Invalidate active list and optionally stop waiting for interval.

#### Testing Checklist

- [ ] Refresh button refetches without full page reload.
- [ ] Activity timeline shows all event transitions.

---

## Phase Completion Checklist

- [ ] Refresh buttons implemented on all target pages.
- [ ] Activity timeline uses reservation events.
- [ ] Lint and build pass.
