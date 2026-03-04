# Slot Booking — Acceptance Criteria & User Flows

## Overview

Slot booking is the core interaction model across both the player side (discovery & booking) and owner side (availability studio). A slot is a 1-hour cell on a weekly grid. Users select one or more contiguous slots to create bookings (player) or blocks (owner).

Both surfaces share a common range selection engine (`src/components/kudos/range-selection/`) and a linear-index grid model that supports cross-midnight selections.

---

## 1. Grid Model

### Hour Layout

Hours are sorted using `sortHoursInScheduleOrder()` which detects overnight schedules by finding the largest gap between consecutive hours:

| Court Schedule | Grid Layout |
|---------------|-------------|
| 6 AM – 10 PM | `[6, 7, 8, ..., 21]` |
| 6 AM – 2 AM (overnight) | `[6, 7, ..., 23, 0, 1]` |
| 24-hour | `[0, 1, 2, ..., 23]` |

### Linear Indexing

Grid cells use flat indices: `linearIdx = dayColIdx * hoursPerDay + hourIdx`. This enables drag-to-select across day boundaries without special casing.

### Time Zone Contract

- All day keys are `YYYY-MM-DD` in the **place's time zone** (not UTC).
- All persisted times are ISO 8601 UTC strings.
- `buildDateFromDayKey(dayKey, minuteOffset, timeZone)` constructs a `Date` from a day key and minute-of-day offset in the place time zone.

---

## 2. Range Selection Engine

Shared Zustand store powering both player and owner grids.

### Interaction Flows

| Gesture | Behavior |
|---------|----------|
| **Single tap/click** | Selects 1 cell. Enters "extend mode" (pulsing indicator). |
| **Drag** | Selects contiguous range from anchor to release point, clamped at first unavailable cell. |
| **2nd click (extend mode)** | Extends selection from original cell to clicked cell. |
| **Shift+click** | Extends from current range start to clicked cell. |
| **Same-cell re-click** | Clears selection. |

### Touch Handling

- Touch events use a 150 ms hold delay before starting selection (prevents accidental drags while scrolling).
- If finger moves > 10 px before the delay fires, the hold is cancelled (scroll passthrough).

### RangeSelectionConfig Contract

Every grid surface provides a config object:

```
isCellAvailable(idx) → boolean       // Can this cell be selected?
computeRange(anchor, target) → range | null  // Is this range valid?
clampToContiguous(anchor, target) → idx      // Clamp to nearest valid endpoint
commitRange(startIdx, endIdx) → void         // Finalize selection
onClear() → void                             // Clear selection
```

### Visual States Per Cell

| State | Meaning |
|-------|---------|
| `inRange` | Cell is part of the active/committed selection |
| `isStart` / `isEnd` | First/last cell of the range |
| `inHoverPreview` | Cell is in the preview shown during extend mode hover |
| `isPendingStart` | Cell is awaiting extension (pulsing) |

---

## 3. Player-Side Booking

### Slot Display

- Slots come from the backend with `status: "available" | "booked"`.
- `hoursPerDay` is derived from the union of all slot hours across the visible week.
- Past slots (before current time) are disabled regardless of backend status.

### Selection Rules

| Rule | Constraint |
|------|-----------|
| **Max duration** | 24 slots (24 hours) — `MAX_SLOT_COUNT = 24` |
| **Day span** | Same-day or adjacent-day only (cross-midnight). 2+ day gaps rejected. |
| **Contiguity** | All cells in range must be available. Gaps reject the range. |
| **Past cutoff** | Cells before `nowMs` are unselectable. |

### Committed Range

When committed, the grid emits `{ startTime: ISO, durationMinutes: number }`. The parent component stores this and re-derives the visual highlight via `deriveWeekGridCommittedRange()`.

**Cross-week fallback:** If the committed booking's start is outside the visible week (e.g., navigated forward), the grid shows only the overlapping segment.

### Booking Cart Rules

Multiple courts can be booked in a single reservation group.

| Rule | Description |
|------|------------|
| **Day window** | First item establishes a 1–2 day window (in place timezone). All subsequent items must overlap at least one day in that window. |
| **Duplicate court** | Same court cannot appear twice in one booking. |
| **Cross-midnight** | A booking from Sat 9 PM → Sun 2 AM touches both Sat and Sun day keys, so a second item on Sunday is allowed. |

**Error codes:** `DIFFERENT_DAY`, `DUPLICATE_COURT`, `MAX_REACHED`, `DUPLICATE_KEY`.

---

## 4. Owner-Side Availability Studio

### Block Types

| Type | Purpose |
|------|---------|
| `MAINTENANCE` | Court closed for repairs, private events, etc. |
| `WALK_IN` | Walk-in reservation (generates revenue). Resizable. |
| `GUEST_BOOKING` | Manual booking created by owner on behalf of a customer. |

### Selection Rules

| Rule | Constraint |
|------|-----------|
| **Max duration** | `hoursPerDay` slots (one full day equivalent). |
| **Day span** | Same-day or adjacent-day only (cross-midnight). |
| **Blocked cells** | Cannot select through existing blocks or reservations. |
| **Court hours** | Cells outside operating hours are unavailable (dimmed). |
| **Contiguity** | All cells in range must be available. |

### Committed Range Contract

When committed, the grid calls:

```
onCommitRange(startDayKey, startHourIdx, endDayKey, endHourIdx)
```

- For same-day ranges: `startDayKey === endDayKey`.
- For cross-midnight: `startDayKey` and `endDayKey` are adjacent days.
- The coordinator computes actual `Date` objects using `buildDateFromDayKey()` with the respective day key and hour-to-minute offset.

### Block Creation Flow (Desktop)

1. User drags or clicks to select a time range on the week grid.
2. Selection panel appears showing: time label, block type selector (maintenance / walk-in / guest booking), optional notes.
3. User picks block type and submits.
4. tRPC mutation creates the block. Optimistic update shows it immediately.
5. Selection clears on success.

### Block Creation Flow (Mobile)

1. User tap-holds to select a cell, then extends by dragging or second tap.
2. Peek bar appears at bottom with time label and "Create Block" button.
3. Tapping opens the mobile create-block drawer with type selector and notes.
4. Submit creates the block via the same tRPC mutations.

### Block Management

- Tapping an existing block opens a manage peek bar (mobile) or sidebar panel (desktop).
- Blocks can be cancelled (soft-delete with `cancelledAt` timestamp).
- `WALK_IN` and `MAINTENANCE` blocks can be resized via drag handles on top/bottom edges.
- Resize emits `{ blockId, edge: "start"|"end", hoursDelta, baseStart, baseEnd }`.

### Court Hours Windowing

Operating hours are defined per day-of-week as `CourtHoursWindow[]`:

```
{ dayOfWeek: 0–6, startMinute: number, endMinute: number }
```

- `getOperatingHoursForWeek()` collects all open hours across 7 days.
- `buildOpenCellIndexSet()` marks which hourly cells are within operating windows.
- Cells outside windows are dimmed and unselectable.

---

## 5. Cross-Midnight Booking — Detailed Flow

### Scenario: Saturday 10 PM → Sunday 1 AM

**Overnight grid** (court operates 6 AM – 2 AM):
- Each day column shows hours `[6, 7, ..., 23, 0, 1]`.
- Saturday's column contains hour 0 (midnight) and hour 1 (1 AM) — these represent Sunday's early hours but are displayed in Saturday's visual column.
- Selecting Sat 22:00 → Sat 01:00 (hours at indices 16–19) stays within Saturday's column.

**Standard grid** (court operates 24 hours):
- Each day column shows hours `[0, 1, ..., 23]`.
- Selecting Saturday hour 22 → Sunday hour 0 crosses the day column boundary.
- This is an adjacent-day selection: `dayColIdx` goes from 5 to 6.
- `computeRange` allows it because `Math.abs(5 - 6) <= 1`.
- `commitRange` reports `("2026-03-07", 22, "2026-03-08", 0)`.

### Time Computation

The coordinator resolves hour indices to actual `Date` objects:

```
startMin = hours[startHourIdx] * 60   // e.g., 22 * 60 = 1320
endMin   = (hours[endHourIdx] + 1) * 60  // e.g., (0 + 1) * 60 = 60

startDate = buildDateFromDayKey("2026-03-07", 1320, tz)  // Sat 10 PM
endDate   = buildDateFromDayKey("2026-03-08", 60, tz)    // Sun 1 AM
```

**Overnight hour wrapping:** If `hourValue < firstHour` (e.g., hour 0 < hour 6 on a 6 AM–2 AM grid), 1440 minutes (24 hours) is added to the offset so `buildDateFromDayKey` produces the correct next-day timestamp.

---

## 6. Acceptance Criteria Summary

### Player Grid

- [ ] Single click selects one 1-hour cell and enters extend mode.
- [ ] Drag selects a contiguous range, clamped at unavailable cells.
- [ ] Second click in extend mode extends from original cell.
- [ ] Shift+click extends from range start.
- [ ] Same-cell re-click clears selection.
- [ ] Maximum 24 consecutive slots (24 hours).
- [ ] Cross-midnight selection works (adjacent-day only).
- [ ] 2+ day gaps are rejected.
- [ ] Past slots are disabled.
- [ ] Booked slots are disabled.
- [ ] Committed range survives week navigation (shows visible overlap).

### Player Booking Cart

- [ ] First item establishes a day window (1–2 days if cross-midnight).
- [ ] Subsequent items must overlap at least one day in the window.
- [ ] Same court cannot appear twice.
- [ ] Cart validates on add and returns specific error codes.

### Owner Grid

- [ ] Selection respects existing blocks and reservations (cannot select through them).
- [ ] Selection respects court operating hours (closed cells dimmed and unselectable).
- [ ] Cross-midnight selection works (adjacent-day only).
- [ ] Maximum selection = hours-per-day slots.
- [ ] Committed range reports separate start/end day keys for cross-day ranges.
- [ ] Block creation uses correct start/end dates for cross-midnight selections.
- [ ] WALK_IN and MAINTENANCE blocks are resizable.
- [ ] Tap-hold on mobile starts selection after 150 ms delay.
- [ ] Scroll passthrough cancels tap-hold if finger moves > 10 px.

### Shared

- [ ] All times stored as ISO 8601 UTC.
- [ ] Day keys are in place time zone (`place.timeZone`).
- [ ] Overnight grids (e.g., 6 AM–2 AM) sort hours as `[6, ..., 23, 0, 1]`.
- [ ] Time labels and submitted times correctly handle overnight hour wrapping.

---

## 7. Key Source Files

| Area | File | Purpose |
|------|------|---------|
| Player grid UI | `src/components/kudos/availability-week-grid.tsx` | Week grid rendering and interaction |
| Player grid domain | `src/components/kudos/week-grid-domain.ts` | Hour model, committed range derivation |
| Player grid utils | `src/components/kudos/week-grid-utils.ts` | Slot availability, `MAX_SLOT_COUNT`, `TIMELINE_SLOT_DURATION` |
| Booking cart rules | `src/features/discovery/place-detail/helpers/booking-cart-rules.ts` | Day-window and duplicate-court validation |
| Cart machine guards | `src/features/discovery/place-detail/machines/booking-cart-machine.guards.ts` | FSM guard functions |
| Owner grid domain | `src/features/owner/components/booking-studio/owner-week-grid-domain.ts` | Selection config, blocked cells, cross-day logic |
| Owner grid UI | `src/features/owner/components/booking-studio/owner-availability-week-grid.tsx` | Owner week grid component |
| Block/reservation types | `src/features/owner/components/booking-studio/types.ts` | `CourtBlockItem`, `ReservationItem`, `buildDateFromDayKey` |
| Court hours | `src/features/owner/components/booking-studio/court-hours.ts` | Operating hours windows, hour collection |
| Block helpers | `src/features/owner/booking-studio/helpers.ts` | Timeline segment builders for blocks/reservations |
| Range selection store | `src/components/kudos/range-selection/range-selection-store.ts` | Zustand interaction state machine |
| Derived range state | `src/components/kudos/range-selection/core/derived-range.ts` | Active/preview/extend state selectors |
| Cell state hook | `src/components/kudos/range-selection/use-cell-state.ts` | Per-cell visual state computation |
| Schedule hours | `src/common/schedule-hours.ts` | `sortHoursInScheduleOrder` — overnight-aware sorting |
| Time zone utils | `src/common/time-zone.ts` | `getZonedDayKey`, `getZonedDayRangeFromDayKey` |
| Availability studio coordinator | `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx` | Multi-court availability management |
| Court availability coordinator | `src/features/owner/components/place-court-availability/place-court-availability-coordinator.tsx` | Single-court availability management |

---

## 8. Test Coverage

| Test File | Covers |
|-----------|--------|
| `src/__tests__/components/kudos/availability-week-grid.test.ts` | Cross-midnight slot extraction, slot availability, schedule order, day cue state |
| `src/__tests__/components/kudos/week-grid-domain.test.ts` | Hour model building, committed range derivation, cross-week overlap |
| `src/__tests__/components/kudos/week-grid-utils.test.ts` | Slot utility functions |
| `src/__tests__/components/kudos/range-selection-same-cell-clear.test.ts` | Same-cell reselect clearing |
| `src/__tests__/features/owner/booking-studio/helpers.test.ts` | Midnight boundary for block/reservation timeline segments |
| `src/__tests__/features/owner/booking-studio/owner-week-grid-domain.test.ts` | Linear index helpers, blocked cell set, cross-midnight selection, slot cap, commit range dayKey reporting |
| `src/__tests__/features/discovery/place-detail/helpers/booking-cart-rules.test.ts` | Cart day-window validation, duplicate court, cross-midnight adjacency |
| `src/__tests__/features/discovery/place-detail/machines/booking-cart-machine.guards.test.ts` | Cart machine guard functions |
| `src/__tests__/features/discovery/place-detail/helpers/date-adjacency.test.ts` | Day key adjacency checks |
| `src/__tests__/features/discovery/place-detail/helpers/cross-week-range.test.ts` | Cross-week committed range handling |
