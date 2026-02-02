# [01-51] Clean Up TimelineBlockItem + Manage Modal/Drawer

> Date: 2026-02-02
> Previous: 01-50-mobile-manage-block-drawer.md

## Summary

Stripped all action buttons from `TimelineBlockItem` to make it a clean info-only display element. Moved all block management actions (remove, convert to guest, replace with guest) into a new desktop `ManageBlockDialog` and the existing mobile `MobileManageBlockPeekBar` drawer. Clicking a block now opens the manage UI on all viewports.

## Changes Made

### Timeline Block Item (stripped to info-only)

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/timeline-block-item.tsx` | Removed `onRemove`, `isImported`, `onReplaceWithGuest`, `onConvertWalkIn` props and all associated UI (imported badge, convert-to-guest button, replace-with-guest button, red X remove button). Kept info display, resize handles, and `onSelect`. |

### New Desktop Manage Dialog

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/manage-block-dialog.tsx` | **New file** — shadcn Dialog showing block info with conditional Remove, Convert to guest, and Replace with guest actions. |

### Mobile Drawer Enhancements

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/mobile-manage-block-peek-bar.tsx` | Added `onReplaceWithGuest` + `isImported` props with "Replace with guest" button in drawer footer. |
| `src/features/owner/components/booking-studio/mobile-day-blocks-list.tsx` | Added optional `onConvertWalkIn` prop with "Guest" button for walk-in blocks. |

### Week View Column

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/week-day-column.tsx` | Replaced `onRemoveBlock`/`onConvertWalkIn` props with `onSelectBlock`, passed through to `TimelineBlockItem`. |

### Page Wiring

| File | Change |
|------|--------|
| `src/app/(owner)/owner/bookings/page.tsx` | Wired `onSelect`/`onSelectBlock` for all viewports (not just mobile). Added `ManageBlockDialog` for desktop. Updated `MobileManageBlockPeekBar` with import-related props. Added `onConvertWalkIn` to `MobileDayBlocksList`. Removed stripped props from `TimelineBlockItem` and `WeekDayColumn`. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Same wiring pattern: `onSelect` for all viewports, `ManageBlockDialog` for desktop, cleaned up removed props. |

## Key Decisions

- Block card is now purely informational — all management happens through the manage UI (dialog on desktop, drawer on mobile)
- `onSelect` fires on all viewports now, not just mobile — desktop users click to open dialog instead of using inline buttons
- Import-related actions (`isImported`, `onReplaceWithGuest`) added to mobile drawer so mobile users get feature parity with desktop
- `WeekDayColumn` uses `onSelectBlock` instead of passing remove/convert directly to compact timeline items

## Verification

- `npx tsc --noEmit` — passes clean
- `pnpm lint` — only pre-existing errors (scripts `any`, a11y conditional role)
- `pnpm build` — fails only due to missing env vars (pre-existing)
