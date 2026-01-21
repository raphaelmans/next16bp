# Phase 1: Backend Range Availability

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-06 (public reservation discovery)

---

## Objective

Expose public availability endpoints that return start-time options across a date range (month) for place+sports and court-specific views.

---

## Module 1A: Availability Range Endpoints

**User Story:** `US-06`  
**Reference:** `54-00-overview.md`

### Directory Structure

```
src/modules/availability/
├── availability.router.ts
├── dtos/
│   ├── availability.dto.ts
│   └── index.ts
└── services/
    └── availability.service.ts
```

### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `availability.getForCourtRange` | Query | `{ courtId, startDate, endDate, durationMinutes }` | `AvailabilityOption[]` |
| `availability.getForPlaceSportRange` | Query | `{ placeId, sportId, startDate, endDate, durationMinutes }` | `AvailabilityOption[]` |

### Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| courtId | uuid | Yes | Existing court |
| placeId | uuid | Yes | Existing place |
| sportId | uuid | Yes | Existing sport |
| startDate | datetime | Yes | ISO-8601 |
| endDate | datetime | Yes | >= startDate, <= 45 days range |
| durationMinutes | number | Yes | 60-1440, increments of 60 |

### Flow Diagram

```
Public schedule month view
    │
    ▼
availability.getFor*Range
    │
    ▼
availability.service -> timeSlotRepository.findAvailable
    │
    ▼
AvailabilityOption[]
```

### Implementation Steps

1. Add range DTOs + refinements in `availability.dto.ts`.
2. Add router endpoints in `availability.router.ts`.
3. Implement service helpers:
   - group slots by day in place time zone
   - reuse `buildOptionsForCourt` per day
   - best-price selection for place + sport range
4. Sort outputs by `startTime` for stable rendering.

### Code Example

```typescript
const options = await service.getForPlaceSportRange({
  placeId,
  sportId,
  startDate,
  endDate,
  durationMinutes,
});
```

### Testing Checklist

- [ ] Range query returns only available slots in range.
- [ ] Invalid range (>45 days) fails validation.
- [ ] Bookability checks are respected (verified + enabled).

---

## Phase Completion Checklist

- [ ] Endpoints wired and documented.
- [ ] No TypeScript errors.
