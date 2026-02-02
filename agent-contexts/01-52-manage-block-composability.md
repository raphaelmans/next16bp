# [01-52] Manage Block Composability + React Performance

> Date: 2026-02-02
> Previous: 01-51-manage-block-cleanup.md

## Summary

Extracted shared block info rendering and manage-block state/callback logic into reusable pieces. Both `ManageBlockDialog` and `MobileManageBlockPeekBar` now use a shared `BlockInfoDisplay` component and both page files use a shared `useManageBlock` hook with stable callbacks, making `React.memo` effective.

## Changes Made

### New Files

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/block-info-display.tsx` | Shared component for badge, duration, time range, reason, price, imported badge |
| `src/features/owner/components/booking-studio/use-manage-block.ts` | Shared hook: selected block state + stable `useCallback` handlers (close, remove, convertWalkIn, replaceWithGuest) |

### Modified Files

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/manage-block-dialog.tsx` | Wrapped with `React.memo`, uses `BlockInfoDisplay` instead of inline rendering |
| `src/features/owner/components/booking-studio/mobile-manage-block-peek-bar.tsx` | Uses `BlockInfoDisplay` in drawer content (peek bar keeps own inline badge for compact view) |
| `src/app/(owner)/owner/bookings/page.tsx` | Replaced `selectedManageBlockId` state + inline callbacks with `useManageBlock` hook; passes stable refs |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Same hook wiring (simpler — no import/replace features) |

## Key Decisions

- Peek bar keeps its own inline badge in the compact summary strip (different layout from the drawer/dialog info display), so `BlockInfoDisplay` is only used in the expanded drawer content
- `replaceWithGuest` and `convertWalkIn` share the same handler in the hook (both call `onOpenReplaceDialog`)
- Hook placement in pages is after `handleCancelBlock`/`handleOpenReplaceDialog` declarations to avoid referencing uninitialized variables
