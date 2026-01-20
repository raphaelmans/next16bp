# [00-73] Hide Curated Verification UI

> Date: 2026-01-20
> Previous: 00-72-court-metadata-undefined-fix.md

## Summary

Adjusted the public place detail page so the "verification required / booking status" messaging is not shown for curated venues.

## Changes Made

### UI Logic

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/page.tsx` | Added `showBookingVerificationUi` guard and used it to hide verification/booking-status UI blocks when `place.placeType === "CURATED"`. |

## Key Decisions

- Curated venues are view-only, so "verify to book" messaging is misleading; gate it behind `!isCurated`.
- Keep the existing `showBooking` logic intact; only suppress the non-bookable verification UI by introducing a dedicated boolean (`showBookingVerificationUi`).

## Next Steps (if applicable)

- [ ] Run `pnpm build` (optionally `TZ=UTC pnpm build`) to confirm no SSR/type regressions.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
