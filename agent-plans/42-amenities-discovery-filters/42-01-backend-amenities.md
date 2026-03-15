# Phase 1: Backend Amenities Aggregation + API Route

**Dependencies:** None  
**Parallelizable:** Partial  
**User Stories:** US-14-01

---

## Objective

Aggregate distinct amenities from places and expose them via a public API route for the discovery filters.

---

## Modules

### Module 1A: Aggregate Amenities from Place Repository

**User Story:** `US-14-01`  
**Reference:** `42-00-overview.md`

#### API Updates

| Layer | Change |
|-------|--------|
| `PlaceRepository` | Add `listAmenities()` to return distinct amenity names |
| `PlaceDiscoveryService` | Add `listAmenities()` to call repository |

#### Data Logic

- Select distinct `place_amenity.name` values.
- Normalize by trimming whitespace.
- Filter out empty values.
- Return sorted list (A–Z).

#### Implementation Steps

1. Add `listAmenities()` to `IPlaceRepository` and `PlaceRepository`.
2. Add `listAmenities()` to `IPlaceDiscoveryService` + implementation.
3. Wire method in place factory if needed.

#### Testing Checklist

- [ ] Distinct amenities returned once
- [ ] Output sorted alphabetically

---

### Module 1B: Public Amenities API Route

**User Story:** `US-14-01`  
**Reference:** `42-00-overview.md`

#### Endpoint

| Path | Method | Response |
|------|--------|----------|
| `/api/public/amenities` | GET | `{ data: string[] }` |

#### Error Handling

- Use `handleError` and `wrapResponse` (matches `google-loc` pattern).
- `requestId` from headers or `crypto.randomUUID()`.

#### Implementation Steps

1. Create route handler in `src/app/api/public/amenities/route.ts`.
2. Resolve `PlaceDiscoveryService.listAmenities()`.
3. Return `NextResponse.json(wrapResponse(data))`.

#### Testing Checklist

- [ ] Route returns `200` with list
- [ ] Invalid errors map through handler

---

## Phase Completion Checklist

- [ ] Repository aggregation method works
- [ ] Public route returns aggregated list
- [ ] Build passes
