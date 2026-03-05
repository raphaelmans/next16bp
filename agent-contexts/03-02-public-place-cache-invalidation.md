---
tags:
  - agent-context
  - frontend/venues
  - backend/place
  - backend/court
  - backend/place-verification
  - backend/mobile/v1/organization/venues
  - backend/mobile/v1/organization/courts
date: 2026-03-06
previous: 03-01-analytics-dashboard.md
related_contexts:
  - "[[03-00-availability-perf-optimization]]"
  - "[[01-49-home-featured-cache-tag]]"
---

# [03-02] Public Place Cache Invalidation

> Date: 2026-03-06
> Previous: 03-01-analytics-dashboard.md

## Summary

Moved public place detail pages to cache-until-invalidated behavior and wired on-demand `revalidatePath` across place/court/verification write paths (tRPC + mobile API handlers). Also fixed a runtime circular dependency by removing `publicCaller` usage from the cache helper.

## Related Contexts

- [[03-00-availability-perf-optimization]] - Same place-detail performance track; this extends the work with cache lifecycle controls.
- [[01-49-home-featured-cache-tag]] - Prior on-demand cache invalidation pattern used as a reference point.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(public)/venues/[placeId]/page.tsx` | Switched to `revalidate = false` to keep shell cached until explicitly invalidated. |
| `src/app/(public)/places/[placeId]/page.tsx` | Added `revalidate = false` for alias route parity. |
| `src/lib/shared/infra/cache/revalidate-public-place-detail.ts` | Added shared revalidation helper for `/venues/<id|slug>` and `/places/<id|slug>`; added pattern fallback; removed `publicCaller` to break init cycle. |
| `src/lib/modules/place/place-management.router.ts` | Added revalidation after place update/delete/photo mutations. |
| `src/lib/modules/court/court-management.router.ts` | Added revalidation after create/update court mutations. |
| `src/lib/modules/place-verification/place-verification.router.ts` | Added revalidation after submit/toggle-reservations mutations. |
| `src/lib/modules/place-verification/admin/place-verification-admin.router.ts` | Added broad place-detail page revalidation after admin approve/reject review actions. |
| `src/lib/modules/court/admin/admin-court.router.ts` | Added revalidation across admin place/court write flows (update, activate/deactivate, transfer, recurate, photo ops, delete). |
| `src/app/api/mobile/v1/organization/venues/[venueId]/route.ts` | Added revalidation after venue PATCH/DELETE writes. |
| `src/app/api/mobile/v1/organization/venues/[venueId]/courts/route.ts` | Added revalidation after court creation. |
| `src/app/api/mobile/v1/organization/courts/[courtId]/route.ts` | Added revalidation after court update. |
| `src/app/api/mobile/v1/organization/venues/[venueId]/photos/route.ts` | Added revalidation after photo upload. |
| `src/app/api/mobile/v1/organization/venues/[venueId]/photos/[photoId]/route.ts` | Added revalidation after photo removal. |
| `src/app/api/mobile/v1/organization/venues/[venueId]/photos/reorder/route.ts` | Added revalidation after photo reorder. |
| `src/app/api/mobile/v1/organization/venues/[venueId]/reservations/toggle/route.ts` | Added revalidation after reservations enable/disable toggle. |
| `src/app/api/mobile/v1/organization/venues/[venueId]/verification/submit/route.ts` | Added revalidation after verification submission. |

### Documentation

| File | Change |
|------|--------|
| `agent-contexts/03-02-public-place-cache-invalidation.md` | Logged implementation context, decisions, and follow-ups. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/venues` from `src/app/(public)/venues/[placeId]/page.tsx` and `src/app/(public)/places/[placeId]/page.tsx`
- `backend/place` from `src/lib/modules/place/place-management.router.ts`
- `backend/court` from `src/lib/modules/court/court-management.router.ts` and `src/lib/modules/court/admin/admin-court.router.ts`
- `backend/place-verification` from `src/lib/modules/place-verification/*.router.ts`
- `backend/mobile/v1/organization/venues` from changed `src/app/api/mobile/v1/organization/venues/**/route.ts`
- `backend/mobile/v1/organization/courts` from changed `src/app/api/mobile/v1/organization/courts/[courtId]/route.ts`

## Key Decisions

- Used path-based on-demand invalidation near mutation handlers to keep ownership local to write paths.
- Kept availability/add-ons/booking data client-demand only; server cache concerns apply to page shell and server sections.
- Removed `publicCaller` from cache helper to avoid `appRouter` initialization cycles during dev compilation.
- Added a conservative fallback (`revalidateAllPublicPlaceDetailPages`) when slug is unavailable instead of introducing cross-layer dependencies.

## Next Steps (if applicable)

- [ ] Verify dev runtime after hot reload/restart (`/organization/bookings` and `/api/trpc/*` compile path).
- [ ] Run manual parity check: mutate venue/court/verification data and confirm public detail pages refresh on next visit.
- [ ] If needed, optimize invalidation scope further by introducing stable place-detail cache tags.

## Commands to Continue

```bash
pnpm dev
pnpm lint
```
