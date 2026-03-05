---
tags:
  - agent-context
  - frontend/owner
  - frontend/chat
date: 2026-03-05
previous: 02-07-settimeout-overflow-fix.md
related_contexts:
  - "[[01-40-mobile-peek-bar]]"
  - "[[01-53-peek-bar-mutual-exclusion]]"
---

# [02-08] Mobile Peek Bar Nav Offset

> Date: 2026-03-05
> Previous: 02-07-settimeout-overflow-fix.md

## Summary

Fixed mobile selection and manage-block peek bars overlapping with the bottom navigation bar. Positioned them above the nav using `bottom-[calc(3.5rem+max(0px,env(safe-area-inset-bottom)))]` on mobile, resetting to `bottom-0` at `md` breakpoint where the bottom nav hides.

## Related Contexts

- [[01-40-mobile-peek-bar]] - Original peek bar implementation
- [[01-53-peek-bar-mutual-exclusion]] - Peek bar mutual exclusion logic

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/booking-studio/mobile-selection-peek-bar.tsx` | Changed from `fixed bottom-0` to `bottom-[calc(3.5rem+...)]` with `md:bottom-0` reset |
| `src/features/owner/components/booking-studio/mobile-manage-block-peek-bar.tsx` | Same bottom offset fix as selection peek bar |

## Tag Derivation (From This Session's Changed Files)

- `frontend/owner` - Both changed files are in `src/features/owner/`
- `frontend/chat` - Reviewed `inbox-floating-sheet.tsx` for consistency (no changes needed)

## Key Decisions

- Used `3.5rem` offset matching the nav bar's `h-14` height, plus safe-area-inset-bottom via CSS calc
- Reset to `bottom-0` at `md` breakpoint since the bottom nav uses `md:hidden`
- Confirmed `inbox-floating-sheet.tsx` already handles this correctly with `bottom-[calc(5rem+...)]` and `md:bottom-6`

## Next Steps (if applicable)

- [ ] Verify peek bars render correctly on iOS devices with home indicator (safe area)
