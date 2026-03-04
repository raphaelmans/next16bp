## Why

The mobile booking sheet shows one day at a time via `TimeRangePicker`, forcing users to tap between days in the `MobileDateStrip` to compare availability — slow, context-losing, and error-prone for cross-midnight bookings. Desktop already shows a 7-day `AvailabilityWeekGrid` that enables at-a-glance scanning and cross-day selection. Bringing this to mobile closes the UX gap and makes the most common player action (finding and booking an available slot) significantly faster.

## What Changes

- **New `MobileWeekGrid` component** — compact 7-column color-coded grid (28px time label col + 7×1fr day columns, 48px row height) that fits on 375px+ screens without horizontal scroll. Replaces both `MobileDateStrip` and `TimeRangePicker` in the mobile booking sheet.
- **Week-range data fetching on mobile** — switch from per-day availability queries to week-range queries (same endpoints desktop uses: `getForCourtRange`, `getForPlaceSport`), reducing round-trips from 7 to 1.
- **Unified selection model** — reuse the existing `RangeSelectionProvider` + Zustand store for tap/drag selection, with `touch-action: pan-y` for scroll disambiguation.
- **Remove `MobileDateStrip` from booking sheet** — day navigation is now built into the grid's column headers. Calendar jump modal stays for week-to-week navigation.
- **Cross-midnight selection** — native via adjacent grid columns (no merge logic needed, unlike the current single-day approach).

## Capabilities

### New Capabilities
- `mobile-week-grid`: Compact 7-day availability grid component for mobile booking, including cell rendering, touch interaction, summary bar, skeleton loading, and integration into the mobile booking sheet.

### Modified Capabilities
_(none — no existing spec-level requirements change; this is a new UI component using existing availability APIs)_

## Impact

- **Client code**: New component in `src/components/kudos/`, modifications to `place-detail-mobile-sheet.tsx` and `place-detail-booking-mobile-section.tsx`.
- **Data fetching**: Mobile section adds `useQueryDiscoveryAvailabilityForCourtRange` and week-range `useQueryDiscoveryAvailabilityForPlaceSportRange` (same hooks desktop already uses).
- **Removed**: `MobileDateStrip` and `TimeRangePicker` imports from mobile sheet (components themselves remain for use elsewhere).
- **No API changes**: Uses existing availability endpoints with existing query shapes.
- **No DB changes**: Pure frontend change.
