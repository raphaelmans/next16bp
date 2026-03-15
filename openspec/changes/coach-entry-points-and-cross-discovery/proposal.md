## Why

KudosCourts now has meaningful coach discovery and coach-portal functionality, but a coach arriving from the public landing page or `/courts` still experiences the product as player-first and owner-second. This change closes the acquisition and re-entry gap by adding low-emphasis coach entry points that make the coach path discoverable without reframing the product away from courts.

## What Changes

- Add additive coach discovery and coach-onboarding entry points to the public landing page navigation, helper CTA area, and shared footer.
- Add a coach cross-discovery CTA to `/courts`, including a context-preserving link target and a coach alternative in empty-results states.
- Add signed-in coach shortcuts on public navbar surfaces and `/home`, choosing between `Coach Portal` and `Become a Coach` based on existing coach setup state.
- Keep the existing court and owner funnels primary; coach entry remains secondary and browse-first.

## Capabilities

### New Capabilities
- `coach-entry-points`: Public and signed-in entry points that surface coach discovery and coach onboarding from existing landing, discovery, and home surfaces.

### Modified Capabilities

None.

## Impact

- **Public UI**: `src/features/home/**`, `src/features/discovery/**`, and the shared public footer gain new coach entry points.
- **Shared link logic**: a new client-safe helper translates court discovery state into coach discovery destinations while preserving only shared filters.
- **Coach readiness wiring**: signed-in entry points reuse existing coach setup status queries; no backend contract changes are required.
- **Backend/data**: no database, API, auth-role, or route-family additions.
