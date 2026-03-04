## 1. Extract Shared Utilities from Desktop Grid

- [ ] 1.1 Extract `getHourFromSlot`, `isSlotAvailable`, `isSlotSelectable`, `isSameInstant`, and `TIMELINE_SLOT_DURATION` from `availability-week-grid.tsx` into a shared module (e.g., `src/components/kudos/week-grid-utils.ts`) so both desktop and mobile grids can import them
- [ ] 1.2 Update `availability-week-grid.tsx` to import from the new shared module instead of defining inline
- [ ] 1.3 Verify desktop grid still works correctly after extraction (lint passes)

## 2. Create MobileWeekGrid Component

- [ ] 2.1 Create `src/components/kudos/mobile-week-grid.tsx` with the outer `MobileWeekGrid` component: accepts props (`dayKeys`, `slotsByDay`, `timeZone`, `selectedRange`, `onRangeChange`, `onClear`, `todayDayKey`, `maxDayKey`, `cartedStartTimes`), computes `committedRange` + `RangeSelectionConfig`, wraps inner content in `RangeSelectionProvider`
- [ ] 2.2 Implement `MobileWeekGridInner` with grid layout: `gridTemplateColumns: "28px repeat(7, 1fr)"`, 48px row height, vertical scroll container with `touch-action: pan-y`
- [ ] 2.3 Implement day header row: single-letter abbreviation + date number, today indicator (filled circle), grid-cols-7 layout
- [ ] 2.4 Implement time label column: 3-hour interval labels ("6a", "9a", "12p", "3p", "6p", "9p") in 28px-wide column, respecting schedule hour order via `sortHoursInScheduleOrder`
- [ ] 2.5 Implement `MobileWeekGridCell`: color-coded background per status (available/booked/maintenance/past/selected/pending/carted), pointer event handlers (`pointerDown`/`pointerEnter`/`pointerUp`) wired to `useRangeSelection` store, `useCellState(linearIdx)` for visual state
- [ ] 2.6 Implement `MobileWeekGridSummaryBar`: displays selected day, start time, end time, duration, estimated price, and a clear action. Hidden when no selection is active.
- [ ] 2.7 Implement `MobileWeekGridSkeleton`: shimmer loading state matching the 7-column grid layout
- [ ] 2.8 Export `MobileWeekGrid`, `MobileWeekGridProps`, and `MobileWeekGridSkeleton` from `src/components/kudos/index.ts`

## 3. Add Week-Range Data Fetching to Mobile Section

- [ ] 3.1 In `place-detail-booking-mobile-section.tsx`, add `weekRangeStartIso` and `weekRangeEndIso` memos (copy pattern from desktop section) computing UTC ISO strings from the displayed week's day keys
- [ ] 3.2 Add `useQueryDiscoveryAvailabilityForCourtRange` query for court mode week data, enabled when `selectionMode === "court"` and a court is selected
- [ ] 3.3 Add `useQueryDiscoveryAvailabilityForPlaceSportRange` query for any-court mode week data, enabled when `selectionMode === "any"` and a sport is selected
- [ ] 3.4 Add `mobileWeekSlotsByDay` memo that processes the week query response via `buildSlotsByDayKey()` into `Map<string, TimeSlot[]>`
- [ ] 3.5 Pass new props to the mobile sheet: `weekDayKeys`, `mobileWeekSlotsByDay`, `todayDayKey`, `maxDayKey`, week query loading state

## 4. Integrate MobileWeekGrid into Mobile Sheet

- [ ] 4.1 Add new props to `PlaceDetailMobileSheetProps`: `weekDayKeys`, `mobileWeekSlotsByDay`, `todayDayKey`, `maxDayKey`
- [ ] 4.2 Replace `MobileDateStrip` + `TimeRangePicker` block with `MobileWeekGrid`, wiring `onRangeChange` to the appropriate handler (court or any mode) and `onClear` to `clearSelection`
- [ ] 4.3 Replace `TimeRangePickerSkeleton` with `MobileWeekGridSkeleton` in the loading state
- [ ] 4.4 Remove `MobileDateStrip` and `TimeRangePicker` imports from the mobile sheet file (keep components available for other uses)
- [ ] 4.5 Keep calendar jump modal intact for week-to-week navigation

## 5. Wire Cart Integration

- [ ] 5.1 Compute `cartedStartTimes` set from cart items in the mobile section and pass to `MobileWeekGrid`
- [ ] 5.2 Ensure carted cells display green ring indicator and are not re-selectable as new anchors

## 6. Validation

- [ ] 6.1 Run `pnpm lint` and fix any issues in new/modified files
- [ ] 6.2 Manually verify 7-column grid renders on 375px viewport without horizontal scroll
- [ ] 6.3 Verify tap selection: single tap → anchor, second tap same day → range, tap adjacent day → cross-midnight range
- [ ] 6.4 Verify vertical scroll is not blocked by selection interaction
- [ ] 6.5 Verify skeleton loading state appears during initial load and week navigation
- [ ] 6.6 Verify cart integration: added items show green ring, carted cells not re-selectable
