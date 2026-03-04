## Why

The current public booking interaction is range-first (pick start, then extend end), and cart rules prevent adding another selection on the same court. That makes it hard for players to reserve discrete time blocks with intentional gaps, even when those slots are available.

## What Changes

- Replace court-mode start/end range interaction with individual slot-click selection.
- Treat each clicked slot as a selectable booking item candidate.
- Auto-merge adjacent selections on the same court into a single item with combined duration.
- Keep non-adjacent selections on the same court as separate items so gap-based reservations are possible.
- Update booking-cart validation from duplicate-court blocking to overlap-aware same-court validation.
- Keep any-court mode behavior unchanged in this change.
- Preserve grouped checkout submission through existing `items` payload and reservation-group creation flow.
- Update booking UI copy where needed from "multi-court" wording to item-based wording when selections can be same-court, different-time.

## Capabilities

### New Capabilities

- `court-slot-click-selection`: Court-mode booking supports individual slot-click selection with adjacent auto-merge and non-adjacent same-court multi-item reservation behavior.

### Modified Capabilities

- `discovery`: Booking selection and cart behavior in place detail flow now support same-court multi-item selection and non-adjacent reservation composition.
- `reservation`: Booking cart validation requirements change from duplicate-court rejection to overlap-based validation for same-court items.
- `reservation-group-booking`: Grouped booking behavior and language expand from multi-court-only framing to multi-item framing, including same-court, different-time items.

## Impact

- Public booking interaction layer (`TimeRangePicker` and range-selection state) in `src/components/kudos/*`.
- Discovery place-detail booking orchestration and cart validation in `src/features/discovery/place-detail/**`.
- Booking checkout query composition and multi-item handling in `src/features/reservation/pages/place-booking-page.tsx`.
- OpenSpec capability deltas for `discovery`, `reservation`, and `reservation-group-booking`.
