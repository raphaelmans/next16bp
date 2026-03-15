# Phase 7: Week + Month Views (motion)

Status: draft

## Objective

Extend the Owner Availability Studio (`/owner/bookings`) beyond single-day selection by adding:

- `view=week`: 7-day time grid (days as columns, hours as rows) with full DnD support.
- `view=month`: month grid picker (42 cells with padding); click a day to zoom into week.

Use the newly-installed `motion` package (Motion for React) for the week↔month transition animations.

## References

- Studio page: `src/app/(owner)/owner/bookings/page.tsx`
- Place-canonical time helpers: `src/shared/lib/time-zone.ts`
- Day picker wrapper: `src/components/ui/calendar.tsx` (react-day-picker)
- Motion for React docs:
  - https://motion.dev/docs/react/installation
  - https://motion.dev/docs/react/animate-presence
  - https://motion.dev/docs/react/use-reduced-motion

## UX Spec (matches provided pseudocode)

### Week view

- Header:
  - Prev / Next week buttons
  - Title: `MMM d - MMM d, yyyy`
  - Toggle button: "View Month"
- Grid:
  - Columns: 7 days
  - Rows: hour slots (60m snap)
  - Court selector remains as-is (existing venue/court selects)
- Interactions:
  - Drag preset → drop into day+hour cell → create block
  - Drag existing block → move across day/time
  - Resize handles → adjust start/end (60m)
  - Import overlay: drag draft rows to day+hour cell

Implementation note (avoid regressions):

- Week view must render blocks as **interactive draggable elements** (not indicator-only marks inside hour cells), otherwise resize/move/remove will not be possible.
- Suggested structure: droppable grid for hit-testing + an overlay layer per-day that renders `TimelineBlockItem` (draggable + `ResizeHandle`s).

### Month view

- Header:
  - Prev / Next month buttons
  - Title: `MMMM yyyy`
  - Hint: "Click a day to view schedule"
- Grid:
  - 42 cells (6 rows × 7 cols)
  - Outside-month days are muted
  - Today highlight
  - Highlight the currently-focused week (based on `dayKey`)
- Interaction:
  - Click day → set `dayKey` + switch to `view=week`

## URL Contract

Continue using URL-driven state via `nuqs`:

- `placeId` (string)
- `courtId` (string)
- `dayKey` (string, place-local `yyyy-MM-dd`)
- `view` (`"day" | "week" | "month"`) — studio default should become `week` once this phase is complete
- `jobId` (optional string)

Notes:

- Keep `dayKey` as the focused day even in `view=month` (for “current week” highlight).
- Switching views must preserve all other params.

## Motion Implementation (no CSS keyframes)

Use Motion for React (`motion`) for transitions:

```tsx
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const shouldReduceMotion = useReducedMotion();

const transition = shouldReduceMotion
  ? { duration: 0 }
  : { duration: 0.3, ease: "easeOut" };

<AnimatePresence mode="wait" initial={false}>
  {view === "month" ? (
    <motion.div
      key="month"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={transition}
    >
      {/* Month grid */}
    </motion.div>
  ) : (
    <motion.div
      key="week"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={transition}
    >
      {/* Week grid */}
    </motion.div>
  )}
</AnimatePresence>
```

Accessibility:

- `useReducedMotion()` must result in instant switches (duration 0).
- Avoid animating large scroll containers if it causes layout jank.

## Time Zone + Date Math

Hard rules:

- Never derive `dayKey` via `toISOString().split("T")[0]`.
- All week/month computations must anchor to the place time zone.

Implementation approach:

- `weekDayKeys`: derived from `dayKey` via `getZonedDayRangeFromDayKey(dayKey, tz).start` (TZDate) + date-fns `addDays`.
- `monthGridDays`: derive month start/end from the focused day, then build a 42-cell array (including outside-days) based on the chosen week start.

## Data Fetching

- `courtBlock.listForCourtRange` should fetch the whole visible window:
  - week: start-of-week → end-of-week
  - month: start-of-grid → end-of-grid (if we want accurate per-day indicators)

## DnD Behavior Notes

- Droppable `data` must include `dayKey` and `startMinute`.
- Import overlay draft-row drop must use `over.data.current.dayKey` (not the currently selected `dayKey`).
- Disable DnD entirely in `view=month` (no droppables).

## Remove / Cancel

- Week view must offer “Remove” directly on each block card (calls existing `courtBlock.cancel`).
- Prefer an icon button on the block itself (hover/focus; always visible on touch) rather than requiring a switch to Day view.

## Workstreams

### Shared / Contract

- [ ] Confirm `view` values and default (`week`).
- [ ] Confirm `weekStartsOn` (Mon vs Sun) and ensure month grid aligns.

### Server / Backend

- [ ] N/A (reuse existing endpoints).

### Client / Frontend

- [ ] Add Week view (grid + navigation).
- [ ] Add Month view (42-cell grid).
- [ ] Use `motion/react` transitions between views.
- [ ] Ensure reduced-motion behavior is correct.

## WIP Notes (from previous attempt)

There may be uncommitted WIP code changes in `src/app/(owner)/owner/bookings/page.tsx` from an earlier approach (month agenda list, not month grid).

To inspect locally:

- `git diff -- src/app/(owner)/owner/bookings/page.tsx`
- `git status --porcelain`
