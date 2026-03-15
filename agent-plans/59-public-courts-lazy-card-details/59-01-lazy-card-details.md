# Phase 1-4: Summary List + Batched Card Details

**Dependencies:** Existing discovery filters + pagination already in place

---

## Objective

Make `/courts` feel faster by returning a fast-to-compute list first and deferring expensive cross-table data to parallel, batched endpoints.

---

## Before / After (Data Fetch)

### Before

```text
UI -> place.list(filters)
  -> DB: base places + count
  -> DB: sports
  -> DB: court counts
  -> DB: lowest prices
  -> DB: cover images
  -> DB: org logos
  -> DB: verification
UI renders after all above completes
```

### After

```text
UI -> place.listSummary(filters)  (fast)
UI paints card shells immediately

Then, in parallel (batched):
  UI -> place.cardMediaByIds({ placeIds })
  UI -> place.cardMetaByIds({ placeIds, sportId? })

UI fills in image/logo + badges/price/verification progressively
```

---

## Phase 1: Backend Summary Endpoint

### Module 1A: `place.listSummary`

#### tRPC Procedure

- **Endpoint:** `place.listSummary`
- **Input:** same as `ListPlacesSchema` (filters, limit, offset)
- **Output:**
  - `items: { id, name, address, city, latitude, longitude, placeType, featuredRank }[]`
  - `total: number`

#### Implementation Notes

- Reuse the existing filtering + ordering logic from `PlaceRepository.list`, but stop after computing the paginated `placeIds` / `placeRecords`.
- Keep joins required for filtering and sorting (sport filter, amenities filter, verification tier).
- Do not compute sports/prices/media/verification outputs here.
- This endpoint becomes the first paint driver.

---

## Phase 2: Batched Card Detail Endpoints

### Module 2A: `place.cardMediaByIds`

- **Endpoint:** `place.cardMediaByIds`
- **Input:** `{ placeIds: string[] }`
- **Output:** `items: { placeId: string; coverImageUrl: string | null; organizationLogoUrl: string | null }[]`

Server work:
- cover image: use existing `getCoverImageByPlaceIds`
- org logo: use existing `getOrganizationLogoByOrganizationIds`
- return an array for stable serialization

### Module 2B: `place.cardMetaByIds`

- **Endpoint:** `place.cardMetaByIds`
- **Input:** `{ placeIds: string[]; sportId?: string }`
- **Output:** `items: { placeId: string; sports: { id; slug; name }[]; courtCount: number; lowestPriceCents: number | null; currency: string | null; verificationStatus: string | null; reservationsEnabled: boolean | null }[]`

Server work:
- sports: `getSportsByPlaceIds`
- court counts: `getCourtCountsByPlaceIds(placeIds, sportId)`
- prices: `getLowestPriceByPlaceIds(placeIds, sportId)`
- verification: single query by placeIds (status + reservationsEnabled)

Performance:
- Inside each endpoint, run independent DB queries via `Promise.all`.

---

## Phase 3: Frontend Hooks + Skeleton Subsections

### Module 3A: Hooks

Add hook(s) in `src/features/discovery/hooks/`:

- `useDiscoveryPlacesSummary(...)` (wraps `trpc.place.listSummary.useQuery`)
- `useDiscoveryPlaceCardDetails(placeIds, sportId?)`:
  - uses `trpc.useQueries((t) => [t.place.cardMediaByIds(...), t.place.cardMetaByIds(...)])`
  - `enabled: placeIds.length > 0`
  - returns `mediaById`, `metaById`, and loading flags

### Module 3B: Composed Card UI

Create a wrapper component (feature-scoped) that composes summary + details:

- `src/features/discovery/components/discovery-place-card.tsx`

Responsibilities:
- Accept `summary` and optional `media`/`meta`
- Use `Skeleton` to reserve space for:
  - sports badges row
  - price row
  - verification badge row
- Avoid layout shift (consistent spacing even while loading)

---

## Phase 4: Switch `/courts` to New Model

### Module 4A: Adoption

- Update `src/app/(public)/courts/page.tsx` to:
  - render from summary items immediately
  - fetch details in parallel keyed by `placeIds`
  - keep existing pagination UI

Note:
- Keep the existing `place.list` endpoint for other callers until migrated.

---

## Testing Checklist

- [ ] Initial load: titles + location paint quickly (before details resolve)
- [ ] Details load progressively (no blank gaps; skeletons visible)
- [ ] Filters update summary immediately; details refetch for new ids
- [ ] Pagination changes page ids; details refetch
- [ ] Map view still works (lat/lng available in summary)
- [ ] `pnpm lint` + `pnpm build`
