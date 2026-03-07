## Why

The current player reservation journey is split between `/reservations/[id]/payment` and `/reservations/[id]`, which adds an avoidable route hop during the most time-sensitive part of the booking flow. That split duplicates data fetching, scatters payment-state decisions across multiple entry points, and weakens the speed and reliability of the player experience.

## What Changes

- Make `/reservations/[id]` the only player reservation route.
- Remove `/reservations/[id]/payment` from the player flow.
- Render payment as an inline reservation-page state addressed by `?step=payment`.
- Keep `nuqs` limited to URL/UI step state and keep reservation data in React Query/tRPC.
- Support both single-reservation and linked/group payment from the canonical reservation page.
- Keep the player reservation UI visually consistent across overview, payment, loading, and status transitions to avoid layout flicker.
- Harden player reservation detail reads so players can only load their own reservation details.

## Capabilities

### New Capabilities
- `player-reservation-canonical-page`: Canonical player reservation route, inline payment flow, and URL-driven payment step behavior under `/reservations/[id]`

### Modified Capabilities

None.

## Impact

- Affected frontend domains: `src/app/(auth)/reservations`, `src/features/reservation`, and player reservation link helpers in `src/common`
- Affected server/query contracts: player reservation detail authorization plus existing reservation detail / linked detail / payment info query usage
- Affected behavior: post-booking navigation, player pay-now CTAs, payment submission flow, cache reuse, realtime convergence, and layout stability on the player reservation page
- Dependencies and constraints: `nuqs`, React Query cache ownership rules, reservation-first conventions in `important/reservation-unification/00-overview.md`, and the hard-cutover decision to remove `/reservations/[id]/payment`
