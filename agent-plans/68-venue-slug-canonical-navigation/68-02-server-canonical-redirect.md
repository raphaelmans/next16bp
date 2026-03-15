# Phase 2: Server Canonical Redirect (UUID -> Slug)

**Dependencies:** Phase 1 complete
**Parallelizable:** No

---

## Objective

Move canonicalization from client-side `router.replace(...)` to the server so UUID entrypoints redirect before the venue detail page paints.

---

## Flow Diagram

```
/venues/:placeId
  (proxy rewrites to /places/:placeId)
        |
        v
Server page (/places/[placeId])
  - fetch place by id/slug
  - if UUID and place.slug exists -> redirect(/venues/<slug>)
  - else -> render client UI
```

---

## Module 2A: Refactor place detail into server wrapper + client component

### File Changes

1. Create `src/app/(public)/places/[placeId]/place-detail-client.tsx`
   - Move the existing `"use client"` detail page component here.
   - Keep exports aligned (default export remains the client component).

2. Replace `src/app/(public)/places/[placeId]/page.tsx` with a server component
   - Responsibilities:
     - `createServerCaller(appRoutes.places.detail(placeId))`
     - `caller.place.getByIdOrSlug({ placeIdOrSlug: placeId })`
     - `notFound()` on failure
     - if `isUuid(placeId)` and `place.slug` differs -> `redirect(appRoutes.places.detail(place.slug))`
     - render `<PlaceDetailClient />` otherwise
   - Re-export `generateMetadata` if needed for `/venues`.

3. Update `src/app/(public)/venues/[placeId]/page.tsx`
   - Stop importing the client page module directly.
   - Re-export `{ default, generateMetadata }` from `../../places/[placeId]/page`.

### Notes

- Keep the canonical URL as `/venues/...` (per `src/proxy.ts` canonical redirects/rewrite behavior).
- This removes the visible URL swap because the redirect happens before client hydration.

---

## Testing Checklist

- [ ] Visiting `/venues/<uuid>` redirects before first paint to `/venues/<slug>`
- [ ] Visiting `/venues/<slug>` renders without redirects
- [ ] No client `router.replace` remaining for place detail canonicalization
