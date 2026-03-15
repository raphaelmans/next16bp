# Phase 1: Backend Discovery Filters + Search

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-14-01

---

## Objective

Support province filtering and free-text search for `/courts` discovery results using the Place list API.

---

## Modules

### Module 1A: Place List Filters + Search

**User Story:** `US-14-01`  
**Reference:** `35-00-overview.md`

#### API Updates

| Layer | Change |
|-------|--------|
| `ListPlacesSchema` | Add `province` + `q` params |
| `PlaceDiscoveryService` | Pass `province` + `q` to repository |
| `PlaceRepository.list` | Apply filters on `city`, `province`, and `q` |

#### Filter Logic

- `province` filter uses case-insensitive exact match
- `city` filter uses case-insensitive exact match
- `q` filter matches **name, address, city, province** (partial match)

#### Implementation Steps

1. Extend `ListPlacesSchema` with `province` + `q`.
2. Update discovery service to pass the new filters.
3. Add new `province` and `q` filters to repository query.

#### Testing Checklist

- [ ] `?province=CEBU` returns Cebu places
- [ ] `?city=CEBU CITY` returns Cebu City places
- [ ] `?q=cebu` matches both city + province entries

---

## Phase Completion Checklist

- [ ] All filters wired through tRPC + repository
- [ ] Search matches name/address/city/province
- [ ] Builds successfully
