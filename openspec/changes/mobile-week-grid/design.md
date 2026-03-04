## Context

The mobile booking sheet currently presents availability one day at a time: a `MobileDateStrip` (7-day horizontal nav with no availability info) paired with a vertical `TimeRangePicker` (slot list for the selected day). Users must tap between days to compare availability, losing context and making cross-midnight bookings error-prone.

Desktop already solves this with `AvailabilityWeekGrid` — a 7-column color-coded grid backed by week-range availability queries. The mobile equivalent needs to fit on 375px+ screens without horizontal scroll while reusing the same selection model and data-fetching infrastructure.

**Current mobile flow**: `MobileDateStrip` + `TimeRangePicker` in bottom sheet, per-day availability queries, single-day selection only.

**Target mobile flow**: `MobileWeekGrid` in bottom sheet, week-range queries, multi-day scanning with same-day and adjacent-day selection.

## Goals / Non-Goals

**Goals:**
- Show 7 days of availability simultaneously on mobile (375px–430px width)
- Reuse the existing `RangeSelectionProvider` + Zustand store for tap/drag selection
- Reuse existing week-range availability API hooks (no new endpoints)
- Support cross-midnight selection natively via adjacent grid columns
- Maintain WCAG 44px minimum touch target size
- Smooth vertical scrolling (no horizontal scroll)

**Non-Goals:**
- Per-cell price display (price shown in summary bar + footer only)
- Long-press tooltip or cell detail popover (v2 enhancement)
- Day-view toggle on mobile (always show full week)
- Landscape-specific optimizations
- Changing the desktop `AvailabilityWeekGrid` behavior

## Decisions

### 1. Grid layout: `28px + 7×1fr` columns, 48px rows

**Choice**: Fixed 28px time-label column + 7 equal-width day columns. 48px row height.

**Rationale**: On the smallest target (375px with 40px sheet padding = 335px content), this yields `(335 - 28) / 7 = 43.9px` per day column — just meeting WCAG's 44px minimum. 48px row height provides adequate vertical touch target. Desktop uses 60px labels + 80px+ columns + 56px rows; these don't fit mobile.

**Alternatives considered**:
- *Horizontal scroll with wider columns*: Better readability per cell, but users lose the at-a-glance 7-day view — the primary goal.
- *5-day workweek grid*: Wider columns (~61px), but excludes weekends — the busiest booking days.
- *Swimlane layout (horizontal day rows)*: Only 2-3 days visible without scroll, defeating the purpose.

### 2. Color-only cells (no text content)

**Choice**: Each cell is a solid color block indicating status. No text labels, prices, or times inside cells.

**Rationale**: At ~44px width, text is unreadable or requires tiny font sizes that hurt accessibility. Color-coding (emerald = available, orange = booked, amber = maintenance, dimmed = past, primary = selected) provides instant visual scanning. Detailed info surfaces in the summary bar when a cell is selected.

**Alternatives considered**:
- *Abbreviated text ("9a", "₱1.5k")*: Too cramped at 44px, especially on localized content.
- *Icons per cell*: Adds visual noise, slows scanning vs. uniform color blocks.

### 3. Reuse `RangeSelectionProvider` from desktop grid

**Choice**: Wrap `MobileWeekGrid` in the same `RangeSelectionProvider` that powers `AvailabilityWeekGrid`, using the same Zustand store with `pointerDown`/`pointerEnter`/`pointerUp` flow.

**Rationale**: The selection store already handles anchor-hover-commit logic, `computeRange` validates adjacent-day constraints, and `useCellState(linearIdx)` provides per-cell visual state. Reimplementing would duplicate non-trivial logic.

**Alternatives considered**:
- *New mobile-specific selection store*: Unnecessary duplication; the store's API is device-agnostic.
- *Direct state machine integration (skip store)*: The `RangeSelectionProvider` already bridges to the time-slot XState machine via `onRangeCommit`. Bypassing it would couple the grid to machine internals.

### 4. Touch disambiguation via `touch-action: pan-y`

**Choice**: Set `touch-action: pan-y` on the scrollable grid container. Selection uses pointer events; vertical scrolling is handled natively by the browser.

**Rationale**: This lets quick vertical flicks scroll normally (browser handles panning) while horizontal drags and hold-and-tap trigger selection via `pointerDown`/`pointerEnter`. Desktop uses `touch-action: none` because it's in a non-scrollable container — mobile needs vertical scroll for the full timeline.

**Alternatives considered**:
- *`touch-action: none` + manual scroll*: Requires reimplementing scroll physics, momentum, and overscroll — fragile and battery-intensive.
- *Gesture library (e.g., use-gesture)*: Adds a dependency for something the browser does natively with `pan-y`.

### 5. Week-range queries (same as desktop)

**Choice**: Switch mobile from per-day queries to `useQueryDiscoveryAvailabilityForCourtRange` and `useQueryDiscoveryAvailabilityForPlaceSportRange` with week boundaries. Process via existing `buildSlotsByDayKey()`.

**Rationale**: Desktop already validates this pattern. Reduces mobile round-trips from up to 7 (one per day as user taps) to 1 per week. Same cache keys, same TanStack Query invalidation.

**Alternatives considered**:
- *Keep per-day queries, prefetch adjacent days*: Still 7 requests, more complex prefetch orchestration, cache fragmentation.

### 6. Compact time labels (every 3 hours)

**Choice**: Show time labels at 3-hour intervals ("6a", "9a", "12p", "3p", "6p", "9p") in the 28px column, instead of every hour like desktop.

**Rationale**: Every-hour labels create visual clutter at this density. 3-hour intervals provide enough orientation. Users can count rows (each = 1 hour) for precision; the summary bar shows exact times on selection.

### 7. Keep calendar jump modal for week navigation

**Choice**: Retain the existing calendar jump dialog for navigating to a different week. Grid column headers show the current week's days.

**Rationale**: The grid shows exactly 7 days. Week-to-week navigation needs a calendar view, which already exists. Adding left/right week arrows is a minor enhancement but not required for v1.

### 8. Selection invariants (locked business logic)

**Choice**: Selection behavior follows strict invariants across week-grid interactions:
- Range must be contiguous.
- Range can span only same-day or adjacent-day columns.
- Tapping/clicking the currently selected single-cell anchor clears selection.
- Tapping/clicking a non-adjacent target resets to a new single-cell anchor.
- Carted cells are non-selectable.

**Rationale**: This matches expected booking UX, prevents hidden state drift, and removes ambiguity in shared range-selection behavior.

### 9. Preserve selection across week navigation

**Choice**: Week jumps preserve committed selection state even when the selected range is not in the visible week.

**Rationale**: This aligns with the selected mobile behavior and avoids unintended clearing while browsing weeks. When navigating back to the week containing the selection, highlight and summary should reappear from committed state.

### 10. Global range-selection behavior alignment

**Choice**: Same-cell clear behavior is implemented in the shared range-selection engine and applied consistently to:
- Player booking week-grid flows.
- Owner timeline/week-column flows that use the shared selection primitives.

**Rationale**: A single behavior contract avoids divergence between mobile, desktop, and owner tools and reduces maintenance burden.

### 11. Duration guardrail in week-grid selection

**Choice**: Apply a hard 24-hour (`1440` minutes) max duration cap in week-grid range computation and clamp logic.

**Rationale**: Backend availability constraints already enforce this limit. Enforcing it in selection logic prevents invalid UI states and avoids server-roundtrip error flows.

### 12. Mobile data contract: one week query per mode/week

**Choice**: Mobile week availability uses one week-range request per displayed week per mode:
- Court mode: `getForCourtRange`.
- Any-court mode: `getForPlaceSportRange`.

**Rationale**: This is the required contract for predictable cache behavior and reduced request volume. Per-day prefetch bursts are out of scope for the migrated mobile booking flow.

## Risks / Trade-offs

**[Risk] 44px cells may feel cramped on iPhone SE (375px)** → Mitigation: Cells meet WCAG minimums. On 390px+ devices (iPhone 12+, which is 90%+ of traffic), cells are 48px+. Monitor analytics for accidental taps.

**[Risk] Color-only cells lose detail compared to current text-based slot list** → Mitigation: Summary bar immediately shows selected time + price. Users who need per-slot detail can still see it in the footer. The primary user need is "see what's available" which color scanning serves better.

**[Risk] Vertical scroll + selection could conflict on some browsers** → Mitigation: `touch-action: pan-y` is well-supported (Safari 13+, Chrome 36+). Selection only triggers on `pointerDown` then `pointerEnter` (drag), not on simple tap-then-scroll. Test on iOS Safari specifically.

**[Risk] Week-range query returns more data than per-day** → Mitigation: The availability API already supports this range; desktop has validated the payload size is reasonable (typically <50KB for 7 days). No pagination needed.

**[Trade-off] No per-cell price visibility** → Accepted: Price per cell would require either tiny text or tooltips. The summary bar + footer provide price info at the right moment (after selection). This matches how users shop: scan for availability first, then check price.

**[Trade-off] Always 7-day view, no single-day drill-down** → Accepted: Eliminates a navigation mode but simplifies the mental model. If users need hour-level detail, the summary bar provides it. Day-view toggle could be added in v2.
