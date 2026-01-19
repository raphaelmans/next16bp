# Phase 2: Amenities Client + Discovery UI + URL State

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-14-01

---

## Objective

Expose amenities data to the client and add optional multi-select amenities filter to `/courts`, including URL state via Nuqs.

---

## Modules

### Module 2A: Amenities Client + Query Keys

**User Story:** `US-14-01`  
**Reference:** `42-00-overview.md`

#### Directory Structure

```
src/shared/lib/clients/amenities-client/
├── index.ts
├── query-keys.ts
└── schemas.ts
```

#### Implementation Steps

1. Add `amenitiesQueryKeys` via `createQueryKeys`.
2. Add `amenitiesResponseSchema` with `createResponseSchema`.
3. Create `amenitiesClient.list()` using ky + error handling from `ph-provinces-cities-client`.
4. Add `useAmenitiesQuery()` hook.

#### Testing Checklist

- [ ] Query returns string array
- [ ] Invalid response throws `ApiClientError`

---

### Module 2B: Discovery Filters + URL State

**User Story:** `US-14-01`  
**Reference:** `42-00-overview.md`

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Amenities | multi-select | No | From amenities API |
| Province | select | No | From PH dataset |
| City | select | No | From selected province |
| Sport | select | No | From sports list |

#### UI Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Amenities [multi]  Province [select]  City [select]  Sport      │
│ (Amenities first; city disabled until province chosen)          │
└────────────────────────────────────────────────────────────────┘
```

#### URL State (Nuqs)

- `amenities`: `parseAsArrayOf(parseAsString)`
- Clear resets amenities + other filters.

#### Filter Logic

- AND semantics: place must have all selected amenities.

#### Implementation Steps

1. Add `amenities` to search params schema with `parseAsArrayOf(parseAsString)`.
2. Update `useDiscoveryFilters` to manage amenities state via Nuqs.
3. Update `useDiscoveryPlaces` to pass amenities list to `trpc.place.list`.
4. Update `PlaceFilters` UI to add amenities first in desktop row + mobile sheet.

#### Testing Checklist

- [ ] Amenities filter appears first
- [ ] Multi-select updates URL
- [ ] Clear filters resets amenities
- [ ] AND filter narrows results

---

## Phase Completion Checklist

- [ ] Amenities client wired to public route
- [ ] Nuqs URL state includes amenities
- [ ] UI filter works in desktop + mobile
- [ ] Build passes
