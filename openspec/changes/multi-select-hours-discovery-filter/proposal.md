## Why

The current discovery time filter accepts a single exact hour, forcing users to run separate searches for adjacent slots like 6 PM and 7 PM. Players rarely care about one exact hour — they have a window of availability. Supporting multi-select hours lets users express that intent in a single search and see all matching venues at once.

## What Changes

- Change the discovery `time` URL-state parameter from a single `HH:mm` string to an array of `HH:mm` strings (e.g. `?time=18:00&time=19:00`).
- Update the discovery filter UI to use a multi-select toggle or checkbox group for hour selection instead of a single-select dropdown.
- Update the discovery summary transport, query identity, and service-layer availability matching to accept and evaluate multiple requested hours.
- Update the availability preview model so cards can reflect which of the requested hours matched.
- Preserve backwards compatibility: a URL with a single `time=HH:mm` value still works.

## Capabilities

### New Capabilities
- `multi-hour-availability-filter`: Multi-select hour filtering in public courts discovery that lets users request multiple exact start times in a single availability-aware search.

### Modified Capabilities
- `public-courts-availability-discovery`: The existing availability-aware filtering requirement changes from accepting an optional single exact start time to accepting an optional array of exact start times.

## Impact

- Affected surfaces: public `/courts` discovery filter UI (desktop row and mobile sheet), discovery list/map result rendering.
- Affected code areas: `src/features/discovery/schemas.ts` (URL state), `src/features/discovery/query-options.ts` (query identity and normalization), `src/features/discovery/hooks/filters.ts` (filter setters), `src/features/discovery/components/court-filters.tsx` (UI), `src/features/discovery/components/courts-page-client.tsx` (debounced value), `src/lib/modules/place/dtos/place.dto.ts` (transport DTO), `src/lib/modules/place/services/place-discovery.service.ts` (matching logic), `src/features/discovery/server/public-courts-discovery.tsx` (SSR prefetch parsing).
- Affected contracts: `time` field type changes from `string | undefined` to `string[] | undefined` across the discovery filter state, query input, and DTO boundaries.
