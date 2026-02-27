## Why

The new owner get-started and booking UI changes introduced a gap: player booking e2e coverage does not yet reliably validate the core reservation path to "awaiting owner confirmation." This is a release-critical flow and needs deterministic automated coverage aligned with real Availability Studio behavior.

## What Changes

- Add a dedicated Playwright e2e scenario for logged-in players reserving exactly one reservable court slot.
- Require the scenario to validate post-booking state on reservation detail as awaiting owner action (`CREATED`/"Owner review is in progress"/"Reservation requested").
- Harden e2e auth and slot-selection steps to handle the current Next.js 16 Availability Studio variants (`Week/Day`, `Pick a court/Any court`, "Select a time" path).
- Add explicit troubleshooting/fixture expectations for environments where no selectable slot is exposed.

## Capabilities

### New Capabilities
- `player-reservation-awaiting-owner-confirmation-e2e`: Deterministic e2e validation for single-slot player reservation that lands in awaiting owner confirmation state.

### Modified Capabilities
- `reservation`: Clarify acceptance-level e2e expectations for player booking to awaiting-owner-confirmation status in the current booking UX.

## Impact

- Affected code: `tests/e2e/**`, Playwright helpers/config, e2e env variables documentation.
- Affected systems: Playwright CI/local execution and test-fixture readiness for reservation availability.
- No backend/API contract breaking changes.
