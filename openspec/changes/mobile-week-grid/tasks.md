## 0. Spec Hardening (OpenSpec Artifacts)

- [x] 0.1 Update `proposal.md` with locked decisions: preserve selection across week jumps, global same-cell clear behavior, 24-hour max range, and non-selectable carted cells
- [x] 0.2 Update `design.md` with explicit selection invariants, global shared-range impact (player + owner), duration guardrail, and one-query-per-week data contract
- [x] 0.3 Update `specs/mobile-week-grid/spec.md` with scenarios for week-jump persistence, same-cell clear across player/owner, 24-hour cap, and single week-range fetch semantics

## 1. Shared Selection Engine Alignment (Global)

- [x] 1.1 Extend shared range-selection contracts to support explicit clear-on-same-cell behavior
- [x] 1.2 Update shared range-selection store logic so reselecting the same single-cell anchor clears committed range
- [x] 1.3 Ensure clear behavior is propagated to parent handlers in both pointer and click paths
- [x] 1.4 Preserve existing contiguous and adjacent-day constraints while adding clear behavior

## 2. Extract and Reuse Week-Grid Utilities

- [x] 2.1 Extract `getHourFromSlot`, `isSlotAvailable`, `isSlotSelectable`, `isSameInstant`, and `TIMELINE_SLOT_DURATION` from `availability-week-grid.tsx` into shared `week-grid-utils` module
- [x] 2.2 Add shared max-duration helpers (`MAX_DURATION_MINUTES = 1440`) for week-grid range compute/clamp paths
- [x] 2.3 Refactor `availability-week-grid.tsx` to import shared utilities and enforce 24-hour max range

## 3. Create `MobileWeekGrid` Component

- [x] 3.1 Create `src/components/kudos/mobile-week-grid.tsx` with outer provider wrapper and committed-range derivation
- [x] 3.2 Implement grid layout: `gridTemplateColumns: "28px repeat(7, 1fr)"`, row height `48px`, vertical scroll with `touch-action: pan-y`
- [x] 3.3 Implement day headers (single-letter weekday + date number + today indicator)
- [x] 3.4 Implement 3-hour time labels using schedule order (`sortHoursInScheduleOrder`)
- [x] 3.5 Implement color-only cells for available/booked/maintenance/past/empty + selected/pending/carted overlays
- [x] 3.6 Enforce interaction rules: contiguous only, same/adjacent day only, carted cells non-selectable, 24-hour max range
- [x] 3.7 Implement summary bar with clear action and estimated selection details
- [x] 3.8 Implement skeleton state matching mobile week-grid structure
- [x] 3.9 Export `MobileWeekGrid`, prop types, and skeleton from `src/components/kudos/index.ts`

## 4. Mobile Data Fetching Migration (Week Range)

- [x] 4.1 In `place-detail-booking-mobile-section.tsx`, compute `weekRangeStartIso` and `weekRangeEndIso` (with booking-window clamping pattern from desktop)
- [x] 4.2 Replace mobile court day query with `useQueryDiscoveryAvailabilityForCourtRange`
- [x] 4.3 Replace mobile any-mode day query with `useQueryDiscoveryAvailabilityForPlaceSportRange` over displayed week
- [x] 4.4 Build `mobileWeekSlotsByDay` via `buildSlotsByDayKey()` and pass week slots map downstream
- [x] 4.5 Keep summary pricing queries accurate for cross-midnight ranges using selected start day/end day boundaries
- [x] 4.6 Remove obsolete day-only cross-midnight merge wiring that is no longer needed with week-grid selection

## 5. Integrate `MobileWeekGrid` into Mobile Booking Sheet

- [x] 5.1 Add new `PlaceDetailMobileSheet` props for week-day keys, week slots map, and week-grid loading state
- [x] 5.2 Replace `MobileDateStrip` + `TimeRangePicker` block with `MobileWeekGrid`
- [x] 5.3 Replace `TimeRangePickerSkeleton` with `MobileWeekGridSkeleton`
- [x] 5.4 Keep calendar jump modal for week navigation and apply preserve-selection policy on jumps
- [x] 5.5 Ensure footer summary/CTA remains coherent with multi-day selections

## 6. Prefetch Contract Alignment

- [x] 6.1 Update mobile prefetch to use one week-range fetch per mode/week (`getForCourtRange` or `getForPlaceSportRange`)
- [x] 6.2 Remove per-day fan-out prefetch loop in migrated mobile booking flow
- [x] 6.3 Keep cache-keying week-scoped to avoid duplicate network bursts during navigation

## 7. Owner Studio Parity (Global Same-Cell Clear)

- [x] 7.1 Wire clear-on-same-cell behavior in owner day selection config (`buildDaySelectionConfig`)
- [x] 7.2 Wire clear behavior in owner week column selection (`WeekDayColumn` commit path)
- [x] 7.3 Ensure owner coordinators clear both committed range and committed-day metadata when selection clears
- [x] 7.4 Verify no regression to block placement/resize flows that also use shared selection state

## 8. Validation and Regression Coverage

- [x] 8.1 Run `pnpm lint` and resolve issues in changed files
- [x] 8.2 Add/adjust tests for same-cell clear on player mobile/desktop and owner flows
- [x] 8.3 Add/adjust tests for 24-hour max range guard in week-grid tap and drag paths
- [x] 8.4 Add/adjust tests for carted-cell non-selectability in mobile week-grid
- [x] 8.5 Add/adjust tests for selection persistence across week navigation (off-screen then restored)
- [x] 8.6 Add/adjust tests asserting single week-range query behavior (no per-day fan-out) in migrated mobile path
- [x] 8.7 Manual QA on 375px and 430px viewports: layout fit, scroll behavior, selection semantics, and summary/footer coherence
