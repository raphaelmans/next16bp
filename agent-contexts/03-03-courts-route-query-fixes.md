---
tags:
  - agent-context
  - frontend/courts
  - frontend/discovery
date: 2026-03-08
previous: 03-02-public-place-cache-invalidation.md
related_contexts:
  - "[[03-02-public-place-cache-invalidation]]"
  - "[[02-05-availability-grid-parity-speed]]"
---

# [03-03] Courts Route Query Fixes

> Date: 2026-03-08
> Previous: 03-02-public-place-cache-invalidation.md

## Summary

Fixed two separate issues affecting public courts discovery routes. First, route-level city and sport pages were using ad hoc Drizzle queries that either failed during RSC render or timed out under the dev server. Second, discovery place-card enrichment queries were stuck in a loading state because feature queries were sharing raw tRPC-shaped cache keys with the app-wide `trpc.Provider` QueryClient.

## Related Contexts

- [[03-02-public-place-cache-invalidation]] - Related public discovery page work on route/server behavior and cache ownership.
- [[02-05-availability-grid-parity-speed]] - Related discovery/place-detail performance work; this session touched the shared discovery progressive detail hook.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/common/trpc-query-key.ts` | Namespaced feature-query cache keys with a `__feature__` prefix to stop collisions with tRPC React-managed cache entries. |
| `src/features/discovery/hooks/place-detail.ts` | Removed temporary direct API debug probes and progressive-detail console logging; kept progressive card enrichment on stable feature-query keys. |
| `src/app/(public)/courts/locations/[province]/[city]/page.tsx` | Replaced route-local venue pills Drizzle query with `publicCaller.place.listSummary(...)` and mapped/sorted results in-page. |
| `src/app/(public)/courts/locations/[province]/[city]/[sport]/page.tsx` | Removed the slow sibling-sport query shape, derived sibling sports from the city aggregate, and replaced venue pills Drizzle query with `publicCaller.place.listSummary(...)`. |

### Documentation

| File | Change |
|------|--------|
| `agent-contexts/03-03-courts-route-query-fixes.md` | Logged the query-collision fix, route-query refactor, verification notes, and remaining caveats. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/courts` from changes under `src/app/(public)/courts/**`
- `frontend/discovery` from `src/features/discovery/hooks/place-detail.ts`
- `agent-context` as the required base tag

## Key Decisions

- Stopped letting feature hooks publish vanilla client queries under raw tRPC query-key shapes because the shared QueryClient can treat those keys as tRPC-owned.
- Moved city and sport route “venue pills” back onto the shared discovery service path instead of maintaining route-local DB queries with separate behavior and performance characteristics.
- Reduced sport-page query risk by filtering sibling sports in application code from the already-safe city aggregate instead of issuing a separate exclusion-heavy SQL path.
- Treated remaining anonymous `auth.me` 401s and `react-grab` websocket failures as unrelated dev-console noise, not part of the courts route regression.

## Next Steps (if applicable)

- [ ] If sport-route dev streaming still feels slow, profile `DiscoveryHydratedCourtsPage` prefetch separately from the page shell on a fresh dev boot.
- [ ] Consider a focused follow-up to confirm whether all remaining `useFeatureQuery` consumers should stay on namespaced keys or be migrated onto direct `trpc.*` hooks over time.
- [ ] Run a broader manual parity sweep for `/courts` list/map and additional province/city/sport combinations beyond Cebu.

## Commands to Continue

```bash
pnpm dev
pnpm lint src/common/trpc-query-key.ts src/features/discovery/hooks/place-detail.ts src/app/'(public)'/courts/page.tsx src/app/'(public)'/courts/locations/'[province]'/page.tsx src/app/'(public)'/courts/locations/'[province]'/'[city]'/page.tsx src/app/'(public)'/courts/locations/'[province]'/'[city]'/'[sport]'/page.tsx
curl -m 12 -sS http://127.0.0.1:3000/courts/locations/cebu/cebu-city
curl -m 12 -sS http://127.0.0.1:3000/courts/locations/cebu/cebu-city/pickleball
```
