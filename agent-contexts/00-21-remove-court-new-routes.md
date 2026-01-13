# [00-21] Remove Court New Routes

> Date: 2026-01-13
> Previous: 00-20-reservation-expiresat-fix.md

## Summary

Removed owner court creation `/new` routes and their helpers, making setup wizard the sole entrypoint. The `/new` URLs now hard-404 to prevent continued use.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/lib/app-routes.ts` | Removed `owner.courts.new` and `owner.places.courts.new` helpers. |
| `src/app/(owner)/owner/courts/new/page.tsx` | Replaced route with `notFound()` to remove `/new`. |
| `src/app/(owner)/owner/places/[placeId]/courts/new/page.tsx` | Replaced route with `notFound()` to remove `/new`. |

## Key Decisions

- Deprecated `/new` court pages by returning 404 to enforce setup wizard usage only.

## Next Steps

- [ ] Re-run `pnpm build` after clearing the `.next/lock` (a build was already running).

## Commands to Continue

```bash
pnpm lint
pnpm build
```
