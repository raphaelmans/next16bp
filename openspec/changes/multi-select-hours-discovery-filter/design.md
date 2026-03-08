## Context

The `availability-aware-public-courts-discovery` change added sport-gated date and time filtering to the public `/courts` discovery page. The current `time` parameter is a single `HH:mm` string in URL state, query identity, DTO, and service-layer matching. This limits users to searching one exact hour per query. The URL state uses `nuqs` with `parseAsString` for `time`, the transport DTO accepts `time?: string`, and the service layer does an exact `===` comparison against each availability option's formatted start time.

## Goals / Non-Goals

**Goals:**
- Let users select multiple hours (e.g. 18:00 and 19:00) in a single discovery search.
- Change `time` from a scalar string to a string array across URL state, query identity, DTO, and service-layer matching.
- Preserve backwards compatibility so a URL with a single `time=18:00` still works.
- Update the availability preview to reflect multi-hour matching.

**Non-Goals:**
- Add time range selection (e.g. "6 PM to 9 PM"). The UI is discrete multi-select, not a range picker.
- Change the date filter behavior.
- Change how availability is fetched from the underlying availability service.
- Add a maximum number of selectable hours.

## Decisions

### Change `time` from `parseAsString` to `parseAsArrayOf(parseAsString)` in URL state

The `nuqs` URL state parser for `time` in `schemas.ts` should change from `parseAsString` to `parseAsArrayOf(parseAsString)`. This encodes multiple hours as repeated query parameters (`?time=18:00&time=19:00`), which is the standard for array URL params in nuqs.

Alternative considered:
- Comma-separated string (`?time=18:00,19:00`). Rejected because `nuqs` has native array support and the rest of the codebase already uses `parseAsArrayOf` for `amenities`.

### Propagate `time` as `string[]` through all filter and query layers

Every type that carries `time` — `SearchParams`, `DiscoveryListFilterState`, `DiscoveryPlaceListSummaryQueryInput`, `DiscoveryAvailabilityInput`, the transport DTO, and the filter hook — changes `time` from `string | undefined` to `string[] | undefined`. This is a clean type-level change with no intermediate adapter layer.

Alternative considered:
- Keep internal types as scalar and fan out at the service boundary. Rejected because it adds unnecessary mapping and doesn't match the URL-state shape.

### Service-layer matching: `some` instead of `===`

In `place-discovery.service.ts`, the current exact-time filter is:
```ts
formatInTimeZone(option.startTime, timeZone, "HH:mm") === filters.time
```
This changes to:
```ts
filters.time.includes(formatInTimeZone(option.startTime, timeZone, "HH:mm"))
```
No other matching logic changes. The `Set` optimization is not needed at v1 scale.

Alternative considered:
- Convert to a `Set<string>` for O(1) lookup. Deferred — typical multi-select is 2-4 hours, so array `.includes()` is negligible.

### UI: Toggle group of hour chips instead of single-select dropdown

The current `<Select>` for time becomes a scrollable row of toggle chips using `<ToggleGroup type="multiple">`. Each chip represents one hour (6 AM–11 PM). Selected hours are visually highlighted. This matches the multi-select mental model better than a multi-select dropdown.

Alternative considered:
- Multi-select combobox like amenities. Rejected because hours are a small, fixed, ordered set — visual toggles are faster to scan and tap on mobile.

### Availability preview reflects the first matched hour from the requested set

The `availabilityPreview.requestedTime` changes from a single string to an array. The `matchedStartTime` still reflects the earliest matched option across all requested hours. The card copy adjusts to show the matched count across the selected hours.

Alternative considered:
- Show per-hour breakdown in the preview. Rejected as too complex for a card-level summary; venue detail is the right place for per-hour breakdown.

## Risks / Trade-offs

- [Type change across layers] → Clean string-to-array migration; no runtime polymorphism. All call sites are in the discovery feature, so blast radius is contained.
- [URL backwards compatibility] → `parseAsArrayOf(parseAsString)` parses `?time=18:00` as `["18:00"]`, so single-value URLs work without any adapter.
- [Normalization complexity] → The existing `normalizeDiscoveryAvailabilityInput` already validates the `HH:mm` pattern; it now validates each element in the array with the same regex.

## Open Questions

- None for the initial implementation slice.
