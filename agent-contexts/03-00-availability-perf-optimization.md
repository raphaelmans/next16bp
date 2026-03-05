---
tags:
  - agent-context
  - frontend/discovery
  - backend/availability
date: 2026-03-05
previous: 02-09-mobile-desktop-booking-consistency.md
related_contexts:
  - "[[02-09-mobile-desktop-booking-consistency]]"
  - "[[01-33-place-detail-ux-overhaul]]"
---

# [03-00] Availability Performance Optimization

> Date: 2026-03-05
> Previous: 02-09-mobile-desktop-booking-consistency.md

## Summary

Optimized venue detail page availability loading performance across three phases: eliminated `next/dynamic` chunk delay for the availability studio component, parallelized sequential DB queries in the availability service, and added a partial index on the reservation table for active-status overlap queries.

## Related Contexts

- [[02-09-mobile-desktop-booking-consistency]] - Recent booking UI work on the same place detail page
- [[01-33-place-detail-ux-overhaul]] - Place detail UX overhaul establishing the availability studio architecture

## Changes Made

### Phase 1: Eliminate dynamic import delay (~100-200ms saved)

| File | Change |
|------|--------|
| `src/features/discovery/place-detail/components/place-detail-availability-studio-slot.tsx` | Replaced `next/dynamic` with `ssr: false` with a direct import of `PlaceDetailAvailabilityStudio`. Component is already in a `"use client"` boundary so it's included in the client bundle directly — no separate chunk download after mount. |

### Phase 2: Parallelize DB queries (~20-50ms saved)

| File | Change |
|------|--------|
| `src/lib/modules/availability/services/availability.service.ts` | In `getForPlaceSport` (line 438) and `getForPlaceSportRange` (line 740): changed sequential `verification → courts` queries to `Promise.all([verification, courts])`. Both depend only on `place.id`, not on each other. |

### Phase 3: Partial index on reservations (scales with data growth)

| File | Change |
|------|--------|
| `src/lib/shared/infra/db/schema/reservation.ts` | Added `idx_reservation_active_court_time` partial index on `(court_id, start_time, end_time)` filtered to active statuses (`CREATED`, `AWAITING_PAYMENT`, `PAYMENT_MARKED_BY_USER`, `CONFIRMED`). Targets `findOverlappingActiveByCourtIds` query. |

Migration applied via `pnpm db:push`.

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery` - `src/features/discovery/place-detail/components/place-detail-availability-studio-slot.tsx`
- `backend/availability` - `src/lib/modules/availability/services/availability.service.ts`

## Key Decisions

- Removed `ssr: false` dynamic import entirely rather than using eager preload fallback — the component has no SSR-incompatible code (no `window` access, standard React + TanStack Query)
- Only parallelized `getForPlaceSport` and `getForPlaceSportRange` methods since those are the venue detail page's hot paths. Other methods (`getForCourt`, `getForCourts`, `getForCourtRange`) have similar sequential patterns but different dependency chains or are less latency-sensitive.
- Partial index uses the same four active statuses that `findOverlappingActiveByCourtIds` filters by — keeps index small as expired/cancelled rows grow
- Migration applied with `db:push` (dev); Drizzle schema has the index definition for future `db:generate` + `db:migrate` flow

## Next Steps (if applicable)

- [ ] Verify availability grid renders correctly on `/venues/[placeId]` with `showBooking=true`
- [ ] Check Network tab: availability tRPC call fires immediately after hydration (no dynamic chunk delay)
- [ ] Verify week navigation and next-week prefetch still work
- [ ] Run `EXPLAIN ANALYZE` on reservation overlap query to confirm partial index is used
