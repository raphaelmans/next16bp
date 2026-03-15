# Phase 1: Slug Propagation

**Dependencies:** None
**Parallelizable:** Yes

---

## Objective

Ensure all `PlaceCardPlace` instances used for public navigation include `slug` whenever it exists in the DB, so `PlaceCard` links directly to `/venues/<slug>`.

---

## Modules

### Module 1A: Include slug in `mapPlaceSummary` (place.list pipeline)

**Target:** `src/features/discovery/helpers.ts`

Implementation steps:
1. In `mapPlaceSummary`, add `slug: item.place.slug ?? undefined` to the returned object.
2. Confirm type alignment: `PlaceSummary extends PlaceCardPlace` already supports `slug?: string | null`.

Verification:
- Home featured cards should link slug-first when provided by `place.list`.

---

### Module 1B: Include slug in `place.listSummary` (backend)

**Target:** `src/modules/place/repositories/place.repository.ts`

Implementation steps:
1. Update `PlaceSummaryItem.place` type to include `slug?: string | null`.
2. In `listSummary()`, include `slug: placeRecord.slug` in the mapped output.
3. Ensure any downstream DTO typing still compiles.

Verification:
- `trpc.place.listSummary` payload includes `place.slug`.

---

### Module 1C: Thread slug through discovery summary mapping to `PlaceCard`

**Target:** `src/features/discovery/hooks/use-discovery.ts`

Implementation steps:
1. Add `slug?: string | null` to `PlaceSummaryListItem.place`.
2. Add `slug?: string | null` to `DiscoveryPlaceSummary`.
3. Update `mapPlaceSummaryItem` to return `slug`.
4. Update `buildDiscoveryPlaceCard` to set `slug` on `PlaceCardPlace`.

Verification:
- `/courts` grid uses slug-first hrefs.

---

## Testing Checklist

- [ ] `/courts` cards point to `/venues/<slug>` when slug exists
- [ ] No regression in pagination / filters
- [ ] TypeScript builds
