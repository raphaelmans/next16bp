# Developer 1 Checklist

**Focus Area:** Amenities discovery filters (backend + frontend)  
**Modules:** 1A, 1B, 2A, 2B

---

## Module 1A: Aggregate Amenities

**Reference:** `42-01-backend-amenities.md`  
**User Story:** `US-14-01`  
**Dependencies:** None

### Setup

- [ ] Add repository method signature in `IPlaceRepository`
- [ ] Add service method signature in `IPlaceDiscoveryService`

### Implementation

- [ ] Implement `PlaceRepository.listAmenities()`
- [ ] Implement `PlaceDiscoveryService.listAmenities()`

### Testing

- [ ] Verify distinct, sorted output

---

## Module 1B: Public API Route

**Reference:** `42-01-backend-amenities.md`  
**User Story:** `US-14-01`  
**Dependencies:** Module 1A

### Implementation

- [ ] Create `src/app/api/public/amenities/route.ts`
- [ ] Wire `handleError` + `wrapResponse`

### Testing

- [ ] GET `/api/public/amenities` returns list

---

## Module 2A: Amenities Client

**Reference:** `42-02-frontend-amenities.md`  
**User Story:** `US-14-01`  
**Dependencies:** Module 1B

### Implementation

- [ ] Add `amenities-client` folder and exports
- [ ] Add schemas + query keys
- [ ] Create `useAmenitiesQuery` hook

### Testing

- [ ] Hook returns list

---

## Module 2B: Discovery Filters + URL State

**Reference:** `42-02-frontend-amenities.md`  
**User Story:** `US-14-01`  
**Dependencies:** Module 2A

### Setup

- [ ] Add amenities to nuqs search params schema

### Implementation

- [ ] Update `useDiscoveryFilters`
- [ ] Update `useDiscoveryPlaces`
- [ ] Add amenities filter UI (first position)

### Testing

- [ ] URL state uses comma-separated list
- [ ] Clear filters resets amenities

---

## Parallelization Summary

| Sequence | Task 1 | Task 2 |
|----------|--------|--------|
| First | Module 1A | Module 1B (after 1A) |
| Then | Module 2A | Module 2B |

---

## Final Checklist

- [ ] All modules complete
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
