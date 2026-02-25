## Why

Schedule pricing add-ons are implemented in backend/runtime logic but are not reachable through current frontend flows. We need owner and player UI integration now so teams can configure add-ons, select them during booking, and safely ship the next UX phase with pricing behavior parity.

## What Changes

- Add owner-facing add-on management UI integrated into court setup, including `OPTIONAL`/`AUTO` mode controls and `HOURLY`/`FLAT` pricing forms.
- Add player-facing add-on selection in discovery and booking flows, including deterministic total updates and booking payload threading with `selectedAddonIds`.
- Surface add-on pricing warnings and transparent price breakdowns in booking/review UX.
- Add frontend adapters/hooks/helpers and targeted tests to keep integration type-safe, deterministic, and aligned with existing architecture conventions.

## Capabilities

### New Capabilities

- `owner-court-addon-management-ui`: Owners can create and maintain court add-ons (mode, pricing type, flat fee, rule windows) with validation-aligned UX.
- `player-booking-addon-selection-ui`: Players can view/select applicable add-ons during booking and see updated totals before confirmation.
- `booking-addon-warning-and-breakdown-ui`: Booking flows display pricing warnings and base-vs-addon breakdowns with clear copy and non-blocking guidance.

### Modified Capabilities

- None.

## Impact

- Affects frontend features under `src/features/owner/**`, `src/features/discovery/**`, and `src/features/reservation/**`.
- Adds shared frontend add-on integration pieces under `src/features/court-addons/**` and mirrored tests under `src/__tests__/**`.
- Reuses existing backend `courtAddon`, availability, and reservation transports; no schema or pricing-rule behavior changes.
