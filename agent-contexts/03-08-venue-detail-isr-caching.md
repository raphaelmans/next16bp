---
tags:
  - agent-context
  - frontend/venues
date: 2026-03-08
previous: 03-07-discovery-inline-meta-loading.md
related_contexts:
  - "[[03-02-public-place-cache-invalidation]]"
  - "[[03-07-discovery-inline-meta-loading]]"
---

# [03-08] Venue Detail ISR Caching

> Date: 2026-03-08
> Previous: 03-07-discovery-inline-meta-loading.md

## Summary

Investigated repeated slow loads and full-page skeleton flashes on public venue detail pages. Confirmed the route was still being served as per-request SSR despite `revalidate = false`, then fixed the dynamic route to participate in on-demand ISR by adding `generateStaticParams() { return []; }` to both public place-detail entrypoints.

## Related Contexts

- [[03-02-public-place-cache-invalidation]] - Established the existing `revalidatePath(...)` invalidation flow for public place detail pages that this change now relies on.
- [[03-07-discovery-inline-meta-loading]] - Recent discovery-side loading optimization work; useful context for distinguishing card/list loading from venue-detail SSR behavior.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(public)/venues/[placeId]/page.tsx` | Added `generateStaticParams()` returning `[]` so `/venues/:slug` can be generated on first hit and cached afterward. |
| `src/app/(public)/places/[placeId]/page.tsx` | Added matching `generateStaticParams()` for the rewritten filesystem route that actually serves the venue detail page. |

### Documentation

| File | Change |
|------|--------|
| `important/core-features/01-discovery-and-booking.md` | Added an engineering note documenting the route rewrite, observed cache headers, the SSR/ISR cause, and the applied fix. |
| `agent-contexts/03-08-venue-detail-isr-caching.md` | Logged the investigation, implementation, and follow-up verification points. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/venues` from `src/app/(public)/venues/[placeId]/page.tsx` and `src/app/(public)/places/[placeId]/page.tsx`

## Key Decisions

- Used `generateStaticParams() { return []; }` instead of broader `dynamic = "force-static"` so the route follows the explicit Next.js pattern for runtime ISR on unknown dynamic params.
- Updated both `/venues` and `/places` entrypoints because public `/venues` requests are internally rewritten to the `/places/[placeId]` filesystem route.
- Kept the existing `revalidate = false` plus `revalidatePath(...)` invalidation model from the earlier public place cache work rather than introducing tags or wider cache refactors.
- Logged the finding in `important/` because the behavior affects the player-facing venue detail experience, not just internal implementation.

## Next Steps (if applicable)

- [ ] Verify on a deployed environment that the second request to `/venues/dink-side-panabo` no longer returns `private, no-store`.
- [ ] Confirm the segment `loading.tsx` only appears on the first cold hit or immediately after explicit invalidation, not on repeated unchanged requests.
- [ ] If the route still serves dynamic responses after deploy, inspect the remaining render path for another dynamic signal forcing request-time rendering.

## Commands to Continue

```bash
pnpm lint
curl -sSI https://kudoscourts.ph/venues/dink-side-panabo
curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' https://kudoscourts.ph/venues/dink-side-panabo
```
