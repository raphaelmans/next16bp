# Phase 1: PH Address Data Foundation

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-14-06

---

## Objective

Ship the Philippines province → cities dataset into the repo, expose it via a cached public API route, and provide a typed client helper for React Query consumption.

---

## Modules

### Module 1A: PH Dataset Assets + Cached API Route

**User Story:** `US-14-06`  
**Reference:** `34-00-overview.md`

#### Directory Structure

```
public/assets/files/
├── philippines-addresses.json
└── ph-provinces-cities.json

src/app/api/public/ph-provinces-cities/route.ts
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/public/ph-provinces-cities` | GET | none | `{ data: Record<string, string[]> }` |

#### Implementation Steps

1. Add `philippines-addresses.json` into `public/assets/files/`.
2. Flatten to `ph-provinces-cities.json` with `province → [cities]` mapping.
3. Create cached API route mirroring `/api/public/countries` behavior.
4. Normalize output (sorted provinces + cities, strip empties).

#### Testing Checklist

- [ ] API returns `data` with province keys
- [ ] `CEBU` includes `CEBU CITY`
- [ ] Response is cached (immutable headers)

---

### Module 1B: PH Provinces/Cities Client + Schema

**User Story:** `US-14-06`  
**Reference:** `34-00-overview.md`

#### Directory Structure

```
src/shared/lib/clients/ph-provinces-cities-client/
├── index.ts
├── query-keys.ts
└── schemas.ts
```

#### Client Contract

| Method | Input | Output |
|--------|-------|--------|
| `phProvincesCitiesClient.list()` | `AbortSignal?` | `Record<string, string[]>` |

#### Implementation Steps

1. Create Zod schema for `{ data: Record<string, string[]> }`.
2. Add React Query hook with infinite `staleTime`.
3. Surface a typed error when response is malformed.

#### Testing Checklist

- [ ] Hook returns cached data without refetching
- [ ] Invalid payload throws typed error

---

## Phase Completion Checklist

- [ ] Data assets stored + flattened
- [ ] Cached API route responds correctly
- [ ] Client helper + schema added
- [ ] Ready for form integration
