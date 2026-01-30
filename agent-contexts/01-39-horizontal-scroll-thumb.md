# [01-39] Horizontal Mobile Scroll Thumb

> Date: 2025-01-30
> Previous: 01-38-mobile-booking-overflow-fix.md

## Summary

Replaced vertical scroll thumb with a horizontal scroll thumb positioned above the time slots in the mobile booking drawer. Dragging left/right maps to scrolling the slot list up/down, avoiding conflicts with native scroll and drawer gestures.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/components/kudos/mobile-scroll-thumb.tsx` | Redesigned to horizontal orientation: compact `h-3.5` track with up/down arrow SVGs flanking the track, grip lines inside thumb for drag affordance, `cursor-grab`/`cursor-grabbing` states, hover feedback |
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Moved `<MobileScrollThumb>` above the scroll container as a sibling (was inside a `flex-row` wrapper beside it). Removed wrapping `<div className="flex-1 flex min-h-0">` — thumb now sits directly above slots |

### Exports

| File | Change |
|------|--------|
| `src/shared/components/kudos/index.ts` | Already exported `MobileScrollThumb` (no change needed) |

## Key Decisions

- **Horizontal orientation**: Avoids overlap with native vertical scroll area and drawer swipe gestures
- **Up/down arrow indicators**: Small triangle SVGs on left (up) and right (down) of track communicate that horizontal drag controls vertical scroll
- **Grip lines on thumb**: Three thin vertical bars reinforce drag affordance and vertical-scroll metaphor
- **Compact sizing**: Track reduced from `h-6` to `h-3.5` to be unobtrusive
- **Color scheme**: Uses `bg-primary/25` idle, `bg-primary/50` active with `shadow-sm` for clear drag feedback

## Architecture

```
Layout (mobile drawer):
  ┌─────────────────────────┐
  │  △ [───[|||]────────] ▽ │  ← horizontal thumb with arrows
  │  ┌───────────────────┐  │
  │  │   time slots      │  │  ← overflow-y-auto container
  │  │   (scrollable)    │  │
  │  └───────────────────┘  │
  └─────────────────────────┘
```

Pointer events on thumb use `setPointerCapture` for reliable drag. `clientX` delta maps proportionally to `scrollTop` changes on the ref'd container.
