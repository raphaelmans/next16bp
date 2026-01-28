# [01-31] Public Venue Court Route Param

> Date: 2026-01-29
> Previous: 01-30-owner-bookings-week-month-motion.md

## Summary

Aligned the new public court route with existing `/venues/[placeId]` conventions to fix Next.js dynamic route param name conflicts.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/app/(public)/venues/[placeId]/courts/[courtId]/page.tsx` | Renamed route param from `[venueSlug]` to `[placeId]` and updated param references. |
| `src/app/(public)/venues/[placeId]/courts/[courtId]/court-detail-client.tsx` | Adjusted imports/usage if needed to match the new route path. |

## Key Decisions

- Standardized on `placeId` for `/venues/*` routes to match existing repo conventions and avoid Next.js dynamic path conflicts.

## Next Steps (if applicable)

- [ ] None.

## Commands to Continue

```bash
pnpm lint
pnpm dev
```
