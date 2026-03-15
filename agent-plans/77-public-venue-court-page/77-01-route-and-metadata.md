# Phase 1: Route + Canonical + Metadata

Status: draft

## Objective

Create the new public route `/venues/<venueSlug>/courts/<courtId>` with:

- Correct canonicalization (UUID → slug)
- Court membership validation (court must belong to venue)
- SEO metadata (`generateMetadata`) with canonical URL excluding query params

## References

- Route helpers: `src/shared/lib/app-routes.ts`
- Place detail server page + canonical redirect: `src/app/(public)/places/[placeId]/page.tsx`
- Public metadata builder for venues: `src/app/(public)/courts/[id]/page.tsx`
- Place lookup: `src/modules/place/place.router.ts` (`place.getByIdOrSlug`)
- UUID check: `src/lib/slug.ts` (`isUuid`)

## Workstreams

### Shared / Contract

- [ ] Add route helper:
  - `appRoutes.places.courts.detail(venueSlugOrId: string, courtId: string): string`
    - Returns `/venues/${venueSlugOrId}/courts/${courtId}`
- [ ] Decide court not-found behavior:
  - Default: `notFound()` when `courtId` is missing from `placeDetails.courts` or inactive.

### Server / Backend

- [ ] N/A (reuse existing tRPC endpoints; no new DB changes).

### Client / Frontend

- [ ] Add server route file:
  - `src/app/(public)/venues/[venueSlug]/courts/[courtId]/page.tsx`
  - Implementation notes:
    - Fetch place details via server caller:
      - `const caller = await createServerCaller(appRoutes.places.detail(venueSlug));`
      - `await caller.place.getByIdOrSlug({ placeIdOrSlug: venueSlug })`
    - Find court within `placeDetails.courts` (ensures membership).
    - Canonicalize venue slug:
      - If `place.slug` exists and `isUuid(venueSlug)` and `venueSlug !== place.slug`, `redirect()` to:
        - `appRoutes.places.courts.detail(place.slug, courtId)`
      - Preserve query params (copy from `searchParams` into the redirect URL).
    - 404 behaviors:
      - If place lookup fails: `notFound()`
      - If court not found in place: `notFound()`
      - If court is inactive: `notFound()` (or render a soft message if later requested)

- [ ] Implement `generateMetadata` in the same file:
  - Title: `${courtLabel} · ${place.name}`
  - Description: `${place.name} · ${courtLabel} · ${sportName} · ${city}, ${province}` (fallback to address)
  - Canonical: `appRoutes.places.courts.detail(place.slug ?? place.id, courtId)`
  - OG image:
    - Prefer `placeDetails.photos?.[0]?.url`, fallback `placeDetails.organizationLogoUrl`.
  - Follow the existing helper patterns from `src/app/(public)/courts/[id]/page.tsx` (`toAbsoluteUrl`, etc.).

## Deliverables

- New route: `src/app/(public)/venues/[venueSlug]/courts/[courtId]/page.tsx`
- New route helper in `src/shared/lib/app-routes.ts`

## Acceptance Criteria

- Visiting `/venues/<uuid>/courts/<courtId>?view=month` redirects server-side to `/venues/<slug>/courts/<courtId>?view=month`.
- Visiting `/venues/<slug>/courts/<courtId>` returns 404 if `courtId` is not part of that venue.
- Metadata contains canonical URL without query params.
