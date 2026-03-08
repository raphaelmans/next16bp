---
tags:
  - agent-context
  - frontend/discovery
  - backend/place/place-discovery
date: 2026-03-08
previous: 03-06-landing-page-overhaul.md
related_contexts:
  - "[[03-00-availability-perf-optimization]]"
  - "[[03-02-public-place-cache-invalidation]]"
---

# [03-07] Discovery Inline Meta Loading

> Date: 2026-03-08
> Previous: 03-06-landing-page-overhaul.md

## Summary

Consolidated the discovery page's 3-tier progressive loading into 2 tiers by inlining metadata (sports, court count, price, verification, ratings) into the summary response. Cards now render with complete text content on first paint. Only image/logo media remains as a progressive query, loading last.

## Related Contexts

- [[03-00-availability-perf-optimization]] - Prior performance work on the discovery availability pipeline
- [[03-02-public-place-cache-invalidation]] - Cache tag architecture for discovery tier1 data

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/lib/modules/place/repositories/place.repository.ts` | Added `PlaceSummaryMeta` interface; optional `meta` field on `PlaceSummaryItem` |
| `src/lib/modules/place/services/place-discovery.service.ts` | `listPlaceSummaries` now enriches results via `enrichSummariesWithMeta()` (parallel meta+review fetch) |
| `src/features/discovery/server/public-courts-discovery.tsx` | Removed separate meta fetch; `mapSummaryItem` extracts inline meta; `buildPublicCourtsPageData` only fetches media |
| `src/features/discovery/public-courts-data.ts` | Moved `meta` into `PublicDiscoveryPlaceSummary`; removed `metaById` from `PublicCourtsPageData` |
| `src/features/discovery/hooks/place-detail.ts` | `buildDiscoveryPlaceCard` reads `summary.meta` (with `overrideMeta` fallback for saved-venues); progressive hook now media-only |
| `src/features/discovery/hooks/search.ts` | Added `DiscoveryPlaceSummaryMeta` type; `mapPlaceSummaryItem` passes through meta |
| `src/features/discovery/components/courts-page-client.tsx` | Removed `metaById` references; cards built from summary meta + media overlay |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery` — client hooks, components, data types
- `backend/place/place-discovery` — service and repository changes

## Key Decisions

- **Meta inlined at service level, not repository** — `enrichSummariesWithMeta()` reuses existing `listCardMetaByPlaceIds` repo method + review aggregates, keeping repository methods unchanged
- **Images load last** — Media (cover images, logos) stays as the only progressive query since images are doubly-async (URL fetch + browser download)
- **Backward compat via `overrideMeta` param** — `buildDiscoveryPlaceCard(summary, media?, overrideMeta?)` allows saved-venues page to keep passing separate meta without migration
- **Removed server-side meta cache function** — `getCachedDiscoveryPlaceCardMeta` and `mapMetaById` deleted; meta now cached as part of the summary response

## Next Steps (if applicable)

- [ ] Verify performance improvement with real data (fewer network requests, faster TTFB)
- [ ] Consider inlining media URLs into summary as well (would eliminate the final progressive step entirely)
- [ ] Clean up `cardMetaByIds` tRPC endpoint if no other consumers remain

## Commands to Continue

```bash
pnpm lint && npx tsc --noEmit  # Validate changes
pnpm dev                       # Test locally
```
