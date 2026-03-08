## Why

The hydrated public `/courts` discovery flow improves first-page loading, but it still cannot answer the user's core booking question: which venues in a city or province actually have a bookable slot on a given day and time. Players must still open venue pages one by one to confirm availability, which makes date-driven discovery slow and uncertain.

## What Changes

- Add sport-gated availability filters to public courts discovery with a required date and an optional exact start time.
- Extend the public discovery summary contract so availability-aware searches can return only matching venues and include a per-card availability preview.
- Keep the existing hydrated discovery flow for non-availability searches, but bypass the long-lived server cache when date or time availability filters are active.
- Add a discovery-local card wrapper that renders the current place card plus a compact availability summary strip for matching venues.
- Keep list and map views on the same filtered dataset so switching views preserves the active availability result set.

## Capabilities

### New Capabilities
- `public-courts-availability-discovery`: Availability-aware public courts discovery that filters venues by sport, date, and optional exact start time, then renders per-card availability previews.

### Modified Capabilities

## Impact

- Affected surfaces: public `/courts` discovery, province and city discovery routes, discovery filter UI, and discovery list/map result rendering.
- Affected systems: discovery URL state, TanStack Query summary identity, public place summary transport, availability service orchestration, and discovery SSR prefetch behavior.
- Affected code areas: `src/app/(public)/courts/**`, `src/features/discovery/**`, `src/lib/modules/place/**`, `src/lib/modules/availability/**`, and `openspec/changes/hydrate-public-courts-discovery/**` as the prerequisite baseline.
