# Public Courts Lazy Card Details - Master Plan

## Overview

Optimize the public discovery page (`/courts`) for faster initial render by splitting discovery fetching into:

1. A fast, filter-friendly summary list request (top-level place fields only)
2. Parallel, batched "sub detail" requests keyed by the returned `placeIds`

This keeps the list endpoint efficient under heavy filtering while lazily loading data that comes from other tables (sports, pricing, media, verification).

---

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| Public discovery page | `src/app/(public)/courts/page.tsx` |
| Discovery hooks | `src/features/discovery/hooks/use-discovery.ts` |
| Place router | `src/modules/place/place.router.ts` |
| Place repository | `src/modules/place/repositories/place.repository.ts` |
| Place card UI | `src/shared/components/kudos/place-card.tsx` |
| Skeleton primitive | `src/components/ui/skeleton.tsx` |
| User Story | `agent-plans/user-stories/14-place-court-migration/14-01-player-discovers-places-with-sport-filters.md` |

---

## Success Criteria

- [ ] `/courts` renders the grid immediately from summary data (no waiting on joins/aggregates)
- [ ] Sports badges / prices / verification / media appear progressively with section-level skeletons
- [ ] Detail fetching uses batched endpoints (`byIds`), not per-place requests
- [ ] Filtering + pagination remains correct (URL-driven via `nuqs`)
- [ ] `pnpm lint` and `pnpm build` pass

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Backend: summary list endpoint | 1A | Yes |
| 2 | Backend: batched card details (media + meta) | 2A, 2B | Yes |
| 3 | Frontend: new hooks + composed card UI + skeleton sub-sections | 3A, 3B | Partial |
| 4 | Rollout: switch `/courts` to new model + validation | 4A | No |

---

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | `place.listSummary` endpoint | Dev 1 | `59-01-lazy-card-details.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | `place.cardMediaByIds` endpoint | Dev 1 | `59-01-lazy-card-details.md` |
| 2B | `place.cardMetaByIds` endpoint | Dev 1 | `59-01-lazy-card-details.md` |

### Phase 3

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 3A | Hooks: summary + batched details via `trpc.useQueries` | Dev 1 | `59-01-lazy-card-details.md` |
| 3B | UI: `DiscoveryPlaceCard` with skeleton sub-sections | Dev 1 | `59-01-lazy-card-details.md` |

### Phase 4

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 4A | Switch `/courts` to new fetching model | Dev 1 | `59-01-lazy-card-details.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Network shape | Summary list + 2 parallel batched detail calls | Progressive rendering without N+1 request explosion |
| Detail granularity | Split media vs meta | Media and meta can resolve independently; allows better skeleton UX |
| Data format | Return arrays keyed by `placeId` (client builds maps) | Avoid serializing `Map` across tRPC boundaries |
| Ordering semantics | Keep existing sorting logic in summary list | Preserve discovery ranking while removing heavy hydration work |
