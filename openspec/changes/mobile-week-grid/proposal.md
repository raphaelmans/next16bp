## Why

The mobile booking sheet shows one day at a time via `TimeRangePicker`, forcing users to tap between days in the `MobileDateStrip` to compare availability — slow, context-losing, and error-prone for cross-midnight bookings. Desktop already shows a 7-day `AvailabilityWeekGrid` that enables at-a-glance scanning and cross-day selection. Bringing this to mobile closes the UX gap and makes the most common player action (finding and booking an available slot) significantly faster.

## What Changes

- **New `MobileWeekGrid` component** — compact 7-column color-coded grid (28px time label col + 7×1fr day columns, 48px row height) that fits on 375px+ screens without horizontal scroll. Replaces both `MobileDateStrip` and `TimeRangePicker` in the mobile booking sheet.
- **Week-range data fetching on mobile** — switch from per-day availability queries to week-range queries (same endpoints desktop uses: `getForCourtRange`, `getForPlaceSportRange`), reducing round-trips from 7 to 1.
- **Unified selection model** — reuse the existing `RangeSelectionProvider` + Zustand store for tap/drag selection, with `touch-action: pan-y` for scroll disambiguation.
- **Remove `MobileDateStrip` from booking sheet** — day navigation is now built into the grid's column headers. Calendar jump modal stays for week-to-week navigation.
- **Cross-midnight selection** — native via adjacent grid columns (no merge logic needed, unlike the current single-day approach).

## Locked Decisions

- **Week navigation selection policy** — selection state is preserved across week jumps (including when the selected range is off-screen) and is shown again when the user returns to the week that contains it.
- **Same-cell reselect policy** — tapping/clicking the currently selected single-cell anchor clears selection. This behavior is global for shared range selection, including player booking and owner studio flows.
- **Range limit policy** — selection cannot exceed `1440` minutes (24 hours) in week-grid interactions.
- **Cart interaction policy** — carted cells remain visually distinguished and are non-selectable as new anchors or range extensions.

## Capabilities

### New Capabilities
- `mobile-week-grid`: Compact 7-day availability grid component for mobile booking, including cell rendering, touch interaction, summary bar, skeleton loading, and integration into the mobile booking sheet.

### Modified Capabilities
- `shared-range-selection`: Add global same-cell clear behavior and enforce 24-hour selection cap across week-grid surfaces.

## Impact

- **Client code**: New component in `src/components/kudos/`, modifications to `place-detail-mobile-sheet.tsx` and `place-detail-booking-mobile-section.tsx`.
- **Data fetching**: Mobile section uses `useQueryDiscoveryAvailabilityForCourtRange` and `useQueryDiscoveryAvailabilityForPlaceSportRange` for single week-range fetches.
- **Selection engine**: Shared range-selection behavior is updated for same-cell clear and max-duration enforcement, including owner timelines that use the same selection primitives.
- **Removed**: `MobileDateStrip` and `TimeRangePicker` imports from mobile sheet (components themselves remain for use elsewhere).
- **No API changes**: Uses existing availability endpoints with existing query shapes.
- **No DB changes**: Pure frontend change.

## OpenSpec Scope Note

This change currently updates OpenSpec artifacts only. No product code is modified in this step.
