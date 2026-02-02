# [01-50] Mobile Manage Block Drawer + Overflow Fix + Right Padding

> Date: 2026-02-02
> Previous: 01-49-home-featured-cache-tag.md

## Summary

Fixed WALK-IN block content overflow on the timeline, added a mobile "Manage block" peek bar + drawer flow for tapping existing blocks, and added right-side padding for mobile thumb scroll space.

## Changes Made

### Overflow Fix

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/timeline-block-item.tsx` | Added `overflow-hidden` to root div to clip content exceeding block height |

### Mobile Manage Block Flow

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/timeline-block-item.tsx` | Added `onSelect` prop with accessible `role`, `tabIndex`, `onClick`, `onKeyDown` handlers; `cursor-pointer` when active |
| `src/features/owner/components/booking-studio/mobile-manage-block-peek-bar.tsx` | **New** — Reusable peek bar + drawer combo. Peek bar shows block badge, time range, "Manage" CTA, dismiss. Drawer shows full details + Remove/Convert actions |
| `src/app/(owner)/owner/bookings/page.tsx` | Added `selectedManageBlockId` state, wired `onSelect` (mobile only), rendered `MobileManageBlockPeekBar` with `onRemove` + `onConvertWalkIn` |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Same wiring but without `onConvertWalkIn` (Remove only) |

### Right-Side Padding

| File | Change |
|------|--------|
| `src/app/(owner)/owner/bookings/page.tsx` | Timeline `CardContent`: `p-6 pr-8 pb-6 lg:pr-6 lg:pb-6` |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Same padding change |

## Key Decisions

- Peek bar follows existing `MobileSelectionPeekBar` pattern (AnimatePresence + motion.div, fixed bottom)
- Drawer follows existing `MobileCreateBlockDrawer` pattern (shadcn Drawer)
- `onSelect` only passed on mobile (`isMobile ? setSelectedManageBlockId : undefined`) to avoid interfering with desktop interactions
- Availability page omits `onConvertWalkIn` since that flow isn't available there
- Added `role="button"`, `tabIndex`, and `onKeyDown` for a11y compliance with Biome lint rules

## Next Steps

- [ ] Test on mobile viewport: tap block -> peek bar -> Manage drawer -> Remove / Convert to guest
- [ ] Verify overflow clipping on short-duration blocks
- [ ] Verify right padding visible on mobile, normal on desktop
