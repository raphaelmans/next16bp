# [01-40] Mobile Bottom Peek Bar for Single Slot Selection

> Date: 2026-01-30
> Previous: 01-39-horizontal-scroll-thumb.md

## Summary

Added a fixed bottom "peek bar" on mobile that appears when a single timeline slot is tapped. Previously, tapping a single cell set `committedRange` but showed no UI feedback — the drawer only opened for multi-cell selections (`s !== e`). Now, single-cell selections show the peek bar with the selected time and a "Tap to create block" prompt.

## Changes Made

### New Component

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/mobile-selection-peek-bar.tsx` | New `MobileSelectionPeekBar` component — fixed bottom bar with spring animation, shows selected time label, tap-to-open drawer, and dismiss (×) button |

### Integration

| File | Change |
|------|--------|
| `src/app/(owner)/owner/bookings/page.tsx` | Imported `MobileSelectionPeekBar`, rendered it conditionally when `isMobile` is true, just above `MobileCreateBlockDrawer` |

## Key Decisions

- Kept the existing `s !== e` guard in `commitRange` — multi-cell selections still auto-open the drawer directly
- Peek bar visibility is driven by store state: `committedRange.startIdx === committedRange.endIdx && !mobileDrawerOpen`
- Used spring animation (`damping: 25, stiffness: 300`) for smooth slide-up/down via `motion/react`
- Added `pb-[env(safe-area-inset-bottom)]` for iOS safe area padding

## Verification

- `pnpm build` passes with no errors
