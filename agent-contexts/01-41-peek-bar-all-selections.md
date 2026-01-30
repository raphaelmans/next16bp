# [01-41] Peek Bar for All Selections

> Date: 2026-01-30
> Previous: 01-40-mobile-peek-bar.md

## Summary

Changed the mobile booking peek bar to appear for all committed selections (single and multi-cell), and removed the auto-open drawer behavior on multi-cell drag. Added a prominent "Create block" pill button for clearer affordance.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(owner)/owner/bookings/page.tsx` | Removed `if (isMobile && s !== e) { setMobileDrawerOpen(true); }` from `commitRange` — drawer no longer auto-opens on multi-cell selection |
| `src/features/owner/components/booking-studio/mobile-selection-peek-bar.tsx` | Changed visibility condition from `isSingleCell && !mobileDrawerOpen` to `!!committedRange && !mobileDrawerOpen`; replaced "Tap to create block" subtitle with a primary-colored "Create block" pill with `ChevronRight` icon |

## Key Decisions

- Peek bar is now the single entry point to the drawer for all mobile selections (consistent UX)
- Used a primary-colored pill button instead of subtitle text to make the tap target obvious
- Kept the × dismiss button and time label unchanged

## Verification

- `pnpm build` passed successfully
