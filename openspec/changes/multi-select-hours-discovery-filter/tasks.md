## 1. URL State & Type Migration

- [ ] 1.1 Change `time` in `src/features/discovery/schemas.ts` from `parseAsString` to `parseAsArrayOf(parseAsString)` and update `SearchParams` type from `string | null` to `string[] | null`.
- [ ] 1.2 Update `DiscoveryListFilterState`, `DiscoveryPlaceListSummaryQueryInput`, and `DiscoveryAvailabilityInput` in `src/features/discovery/query-options.ts` to use `time?: string[]` instead of `time?: string`.
- [ ] 1.3 Update `normalizeDiscoveryAvailabilityInput` in `query-options.ts` to validate each element in the time array against the `HH:mm` pattern and discard invalid entries.
- [ ] 1.4 Update `buildDiscoveryPlaceListSummaryQueryInput` to pass the normalized time array through.

## 2. Filter Hook & Debounce

- [ ] 2.1 Update `useModDiscoveryFilters` in `src/features/discovery/hooks/filters.ts` to handle `time` as `string[] | null` — update `setTime`, `setSportId`, `setDate`, and `clearAll` setters.
- [ ] 2.2 Update the debounced `debouncedTime` in `courts-page-client.tsx` to pass the array type through to `useModDiscoveryPlaceSummaries`.

## 3. Transport & Service Layer

- [ ] 3.1 Change `time` in the place list summary DTO (`src/lib/modules/place/dtos/place.dto.ts`) from `z.string().trim().optional()` to `z.array(z.string().trim()).optional()`.
- [ ] 3.2 Update the availability matching in `src/lib/modules/place/services/place-discovery.service.ts` to use `filters.time.includes(formattedTime)` instead of `=== filters.time`.
- [ ] 3.3 Update `availabilityPreview.requestedTime` type from `string` to `string[]` in the query-options type and the service-layer preview builder.

## 4. Server Prefetch

- [ ] 4.1 Update `parseDiscoverySearchParams` in `src/features/discovery/server/public-courts-discovery.tsx` to parse `time` as an array value from raw search params.

## 5. Filter UI

- [ ] 5.1 Replace the single-select `<Select>` for time in `src/features/discovery/components/court-filters.tsx` (both desktop and sheet layouts) with a `<ToggleGroup type="multiple">` of hour chips.
- [ ] 5.2 Update the `PlaceFiltersSheet` active filter count to count the number of selected hours instead of a boolean time presence.

## 6. Availability Preview

- [ ] 6.1 Update `DiscoveryPlaceCard` in `src/features/discovery/components/discovery-place-card.tsx` to handle `requestedTime` as an array and adjust the card copy for multi-hour matches.

## 7. Verification

- [ ] 7.1 Update or add tests for multi-hour normalization in query-options and service-layer matching.
- [ ] 7.2 Run `pnpm lint` and verify no type errors across the changed files.
