# [01-29] Public Venue Court Page

> Date: 2026-01-29
> Previous: 01-28-availability-studio-optimistic.md

## Summary

Implemented a new public nested court page under venues that combines court-focused details with court-scoped availability (month/day) and booking CTA routing, using Motion for React transitions and place time zone–correct date math.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/shared/lib/app-routes.ts` | Added `appRoutes.places.courts.detail()` helper for `/venues/<slug>/courts/<courtId>`. |
| `src/app/(public)/venues/[venueSlug]/courts/[courtId]/page.tsx` | Added server route with metadata, canonicalization (UUID → slug) preserving query params, and court membership validation. |
| `src/app/(public)/venues/[venueSlug]/courts/[courtId]/court-detail-client.tsx` | Added client UI combining court header + venue context + availability browsing + booking CTA with Motion transitions and reduced-motion support. |

## Key Decisions

- Keep `searchParams` typed as a Promise in the server route to align with Next.js 16 conventions.
- Use month/day availability patterns (no week grid) and existing booking flow `/venues/[slug]/book` with query params for court-scoped selection.
- Apply Motion transitions (`AnimatePresence` + `motion.div`) with `useReducedMotion` to respect accessibility preferences.

## Next Steps (if applicable)

- [ ] None. Implementation is complete; only pre-existing build issues remain (DB timeout during static generation).

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
