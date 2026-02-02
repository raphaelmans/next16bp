# [01-53] Peek Bar Mutual Exclusion

> Date: 2026-02-02
> Previous: 01-52-manage-block-composability.md

## Summary

Added mutual exclusion between `MobileSelectionPeekBar` (create block) and `MobileManageBlockPeekBar` (manage block) so only one is visible at a time. Selecting a block dismisses the selection peek bar; committing a time selection dismisses the manage peek bar.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/use-manage-block.ts` | Added `onSelect` callback param; wrapped `setSelectedId` in `handleSelect` that fires `onSelect` when a block is selected |
| `src/app/(owner)/owner/bookings/page.tsx` | Passed `onSelect: resetSelectionPanel` to `useManageBlock`; added `manageBlock.close()` in `onCommitRange` and `handleWeekCommitRange` |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Same mutual exclusion wiring as bookings page |

## Key Decisions

- Used callback injection (`onSelect`) rather than coupling the hook to the store directly, keeping `useManageBlock` reusable
- Both directions covered: block select dismisses selection, and selection commit dismisses manage block
