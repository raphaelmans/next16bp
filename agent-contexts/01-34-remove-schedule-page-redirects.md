# [01-34] Remove Schedule Page & Fix Post-Login Redirect

> Date: 2026-01-29
> Previous: 01-33-place-detail-ux-overhaul.md

## Summary

Removed the public `/courts/[id]/schedule` page (replaced with redirect to court detail) and fixed the post-login redirect flow so unauthenticated users land on the venue detail page (`/venues/[slug]`) after logging in, instead of the now-defunct schedule page.

## Changes Made

### Schedule Page Removal

| File | Change |
|------|--------|
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Replaced 1567-line schedule page with server redirect to `appRoutes.courts.detail(id)` |

### Post-Login Redirect Fix

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Changed `returnTo` in `handleReserve` from `scheduleHref ?? appRoutes.places.schedule(...)` to `appRoutes.places.detail(placeSlugOrId)` |
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Removed unused `scheduleHref` useMemo block |

### Legacy Route Redirect

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/page.tsx` | Reverted to full page with structured data (user restored original after initial redirect attempt) |

## Key Decisions

- The schedule page is superseded by the venue detail page which now handles all booking interactions inline
- Post-login flow: unauthenticated user clicks "Continue to review" -> redirected to login -> after login, lands on `/venues/[slug]` (venue detail) instead of the old schedule page
- The `/courts/[id]/schedule` route still exists but immediately redirects to `/courts/[id]` for any existing links/bookmarks

## Next Steps

- [ ] Consider removing `/venues/[placeId]/schedule` and `/places/[placeId]/schedule` pages similarly
- [ ] Clean up `appRoutes.places.schedule` and `appRoutes.courts.schedule` route helpers if no longer needed
