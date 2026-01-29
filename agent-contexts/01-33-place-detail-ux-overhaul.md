# [01-33] Place Detail UX Overhaul — Layout, Range Selection, and Zustand Store

> Date: 2026-01-29
> Previous: 01-32-public-venue-court-proxy-rewrite.md

## Summary

Major UX overhaul of the public place detail page (`/venues/[placeId]`). Three interconnected efforts: (1) redesigned desktop/mobile layout that deprioritizes photos and surfaces availability above the fold, (2) drag-to-select range booking interaction across week grid and day timeline, (3) extraction of all interaction logic into a shared zustand vanilla context store with memoized per-cell components.

---

## Part 1: Place Detail Layout Redesign

### Approach

Conversion-optimized layout where booking functionality takes precedence over photos. No full-screen hero image — photos are treated as supporting material.

### Desktop Layout (lg: breakpoint, 1024px)

- **3-column grid** (`lg:grid-cols-3`, 2:1 ratio)
  - **Left column** (2/3): Sport tabs, court selector ("Any court" vs specific), view toggle (week/day), calendar controls, `AvailabilityWeekGrid` or `TimeRangePicker`
  - **Right column** (1/3): Sticky sidebar (`lg:sticky lg:top-24`) with photo carousel (Card), booking summary, Google Maps embed, "What happens next?" explainer

### Mobile Layout (< lg)

- **Single column** with expandable bottom sheet overlay
- Flow: Venue header → Quick actions (Check availability, Directions, Call) → Photo carousel → Bottom sheet
- Bottom sheet (`fixed inset-x-0 bottom-0 z-40`, `max-h-[85vh]`, `rounded-t-3xl`):
  - Drag handle + expand/collapse toggle
  - Sport pills → Court selector → Date controls + MobileDateStrip → TimeRangePicker → Fixed footer with selection summary + "Reserve" CTA
  - `pb-[70vh]` on main content ensures content isn't hidden by sheet

### Photo Strategy

- `PhotoCarousel`: aspect-16/10, swipe navigation, counter pill, lightbox dialog, placeholder gradient for venues without photos
- **Mobile**: appears early in flow (`lg:hidden`) but compact — not a hero
- **Desktop**: right sidebar only (`hidden lg:block`)
- First photo loads with `priority` for LCP

### Changes Made

| File | Change |
|------|--------|
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Complete layout restructure — 3-column desktop grid, mobile bottom sheet, sport/court/date selectors, view mode toggle, booking summary integration |
| `src/features/discovery/components/photo-carousel.tsx` | New compact carousel replacing `photo-gallery.tsx` — swipe, lightbox, keyboard nav, counter pill, fallback placeholder |
| `src/features/discovery/components/mobile-date-strip.tsx` | New 7-day week strip for mobile (`grid-cols-7`) — selected/today/default states, timezone-aware |
| `src/features/discovery/components/photo-gallery.tsx` | Deleted (replaced by `photo-carousel.tsx`) |

---

## Part 2: Range Selection Interaction (Plan 78)

### Approach

Studio-like drag-to-select interaction for booking contiguous time slots. No backend changes — selection maps to existing `{ startTime, durationMinutes }` reservation contract.

### Interaction Model

- **Drag**: Pointer down on available cell → drag to extend → pointer up commits range
- **Two-click flow**: Tap to set start (single-slot commit) → tap another slot to extend to range
- **Shift+click**: Extend from committed start to clicked slot
- **Hover preview**: When awaiting end click, hovering shows preview range
- Selection clamped to contiguous available slots (cannot span booked/maintenance cells)
- Same-day constraint enforced in week grid (cannot span across days)

### Components

| Component | Surface | Behavior |
|-----------|---------|----------|
| `AvailabilityWeekGrid` | Desktop week view | 2D grid (days × hours), click day to drill into day view, range select within a day column |
| `TimeRangePicker` | Mobile + desktop day view | 1D vertical timeline, drag/click/shift-click range selection |
| `AvailabilityMonthView` | Date navigation | Month calendar for day selection (unchanged) |

### Changes Made

| File | Change |
|------|--------|
| `src/shared/components/kudos/availability-week-grid.tsx` | New component — 7-day × N-hour grid with per-cell availability, range selection, summary bar, price display |
| `src/shared/components/kudos/time-range-picker.tsx` | New component — single-day vertical timeline with range selection, summary bar, price display |
| `src/shared/components/kudos/time-slot-picker.tsx` | Existing types (`TimeSlot`) shared with new components |
| `src/shared/components/kudos/index.ts` | Barrel exports for new components |

---

## Part 3: Zustand Context Store Extraction

### Approach

Extracted all drag/click/two-click interaction logic from AWG and TRP into a shared zustand vanilla context store. Enables `React.memo` per-cell components with granular re-renders, eliminates stale closure bugs.

### Architecture

```
Parent (place-detail-client.tsx)
  └─ <RangeSelectionProvider config={...} committedRange={...}>
       ├─ <SummaryBar />          ← primitive selectors (activeStartIdx, activeEndIdx, isAwaitingEndClick)
       └─ <Cell idx={i} />       ← useCellState(idx) with useShallow, React.memo
```

Both AWG (2D) and TRP (1D) normalize to linear indices. Store operates on `number` only.

### New Files: `src/shared/components/kudos/range-selection/`

| File | Purpose |
|------|---------|
| `types.ts` | `RangeSelectionConfig` (injected callbacks), `CellVisualState` (per-cell booleans) |
| `range-selection-store.ts` | Zustand vanilla store factory. State: `anchorIdx`, `hoverIdx`, `hoveredIdx`, `didDrag`, `suppressClick`, `committedRange`, `config`. Actions: `pointerDown` (global listener), `pointerEnter`, `pointerUp`, `click`, etc. |
| `range-selection-provider.tsx` | React Context + Provider (`useRef` store creation) + `useRangeSelection<T>(selector)` hook. Syncs props via `useEffect` |
| `use-cell-state.ts` | `useCellState(idx)` — derives `CellVisualState` using `useShallow` |
| `index.ts` | Barrel export |

### Refactored Components

| File | Change |
|------|--------|
| `time-range-picker.tsx` | Extracted `SummaryBar` + `TimeSlotRow` (both `React.memo`). Deleted ~150 lines of inline interaction state |
| `availability-week-grid.tsx` | Extracted `WeekGridSummaryBar` + `WeekGridCell` (both `React.memo`). Linear index mapping: `linearIdx = dayColIdx * hoursPerDay + hourIdx`. Deleted ~200 lines |

---

## Key Decisions

- **No hero image**: Photos deprioritized to sidebar (desktop) / compact carousel (mobile) to keep availability above the fold
- **Bottom sheet for mobile booking**: Expandable overlay avoids page navigation, keeps context
- **MobileDateStrip**: 7-day quick selector avoids calendar popover overhead on mobile
- **Zustand vanilla store over React store**: Global `pointerup` listener managed in store closure, no React `useEffect` needed
- **`useEffect` for prop sync**: Render-time `store.set()` causes "Cannot update component while rendering" — must use effect
- **Primitive-only selectors for SummaryBars**: `useShallow` fails when returned object contains nested objects (new refs from `computeRange`). Split to `number | null` and `boolean` primitives
- **`useShallow` safe for**: flat booleans (`useCellState`) and stable function refs (action selectors)
- **Two-click flow uses `committedRange` directly**: Avoids stale `isAwaitingEndClick && !isDragging` closure bug

## Bugs Fixed

1. **Desktop two-click flow broken**: `isAwaitingEndClick` falsified during `pointerDown` because setting anchor makes `isDragging=true` → store checks `committedRange.startIdx === committedRange.endIdx` directly
2. **"Cannot update component while rendering"**: `setConfig`/`setCommittedRange` during render → moved to `useEffect`
3. **"getSnapshot should be cached" infinite loop**: `useShallow` with object-valued keys (new refs each call) → split to primitive selectors

## Reference Plans

- `agent-plans/78-public-range-selection/` — Range selection contract, frontend integration, QA plan

## Next Steps

- [ ] Manual QA: single click, two-click, drag, shift+click, hover preview, day switch, mobile tap
- [ ] Verify no regressions in summary bar, price display, animations, keyboard support

## Commands to Continue

```bash
pnpm format && pnpm lint    # Biome check
TZ=UTC pnpm build           # Catch timezone regressions
```
