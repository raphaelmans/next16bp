# Phase 2: Client + Filter Integration

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** `14-01-player-discovers-places-with-sport-filters`

---

## Objective

Adopt slug-based provinces/cities in filters and admin/owner forms while mapping back to canonical names for storage and backend queries.

---

## Modules

### Module 2A: Filters + Forms Consume Slugs

#### Implementation Steps

1. Add helper utilities:
   - `findProvinceBySlug`
   - `findCityBySlug`
   - `buildProvinceOptions`
   - `buildCityOptions`
2. Update discovery filters to store slug values in URL.
3. Update admin/owner forms to use slug values while writing canonical names to DB payloads.

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Province | select | Yes | slug exists in dataset |
| City | select | Yes | slug exists in province cities |

---

### Module 2B: Slug → Canonical Mapping

#### Flow Diagram

```
URL params (slug)
   │
   ▼
Lookup province/city by slug
   │
   ▼
Use canonical name for API/DB
```

#### Implementation Steps

1. Map slugs to canonical names in `useDiscoveryPlaces` before tRPC call.
2. Map slugs to canonical names in admin/owner forms before submit.

---

## Phase Completion Checklist

- [ ] Slug helpers exist in shared lib
- [ ] Filters/forms use slugs
- [ ] Canonical names passed to backend
