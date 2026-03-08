---
tags:
  - agent-context
  - frontend/discovery
  - backend/place-review
date: 2026-03-09
previous: 03-08-venue-detail-isr-caching.md
related_contexts:
  - "[[03-08-venue-detail-isr-caching]]"
  - "[[03-02-public-place-cache-invalidation]]"
---

# [03-09] Venue Review Refresh

> Date: 2026-03-09
> Previous: 03-08-venue-detail-isr-caching.md

## Summary

Fixed stale review state on public venue detail pages after submitting or removing a review. The review mutation flow now waits for cache invalidation on the client, refreshes the App Router payload, and revalidates public venue detail and `/reviews` routes from the server write path.

## Related Contexts

- [[03-08-venue-detail-isr-caching]] - Recent venue-detail caching work; this fix builds on the current App Router caching behavior for public venue pages.
- [[03-02-public-place-cache-invalidation]] - Established the shared `revalidatePublicPlaceDetailPaths(...)` helper that this review-specific invalidation extends.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/discovery/place-detail/components/place-detail-reviews-section.tsx` | Replaced fire-and-forget review invalidations with an awaited refresh helper and `router.refresh()` after successful upsert/remove. |
| `src/lib/shared/infra/cache/revalidate-public-place-detail.ts` | Extended the shared public place revalidation helper to optionally include `/reviews` routes and added a pattern fallback for review pages. |
| `src/lib/modules/place-review/place-review.router.ts` | Revalidated public venue detail and review pages after review upsert/remove mutations. |
| `src/lib/modules/place-review/admin/place-review-admin.router.ts` | Revalidated public venue detail and review pages after admin review removal. |
| `src/lib/modules/place-review/services/place-review.service.ts` | Returned the affected review from remove operations so routers can revalidate the correct place. |

### Documentation

| File | Change |
|------|--------|
| `agent-contexts/03-09-venue-review-refresh.md` | Logged the stale-review investigation, implementation, and follow-up verification steps. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery` from `src/features/discovery/place-detail/components/place-detail-reviews-section.tsx`
- `backend/place-review` from `src/lib/modules/place-review/place-review.router.ts`, `src/lib/modules/place-review/admin/place-review-admin.router.ts`, and `src/lib/modules/place-review/services/place-review.service.ts`

## Key Decisions

- Kept the fix local to the existing review feature instead of introducing a broader query-adapter refactor, since the user-reported bug was isolated to the venue review flow.
- Added server-side route revalidation in addition to client invalidation so the public venue shell and `/venues/:slug/reviews` page stay coherent with the write path.
- Used awaited invalidation plus `router.refresh()` on the client to avoid relying on background refetch timing when the query client has a non-zero `staleTime`.

## Next Steps (if applicable)

- [ ] Manually smoke-test review submit, update, and remove on `/venues/<slug>` while signed in.
- [ ] Manually verify `/venues/<slug>/reviews` reflects new totals and content after a review write.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
