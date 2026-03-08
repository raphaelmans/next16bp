## 1. Discovery Filter State

- [x] 1.1 Extend public discovery URL-state parsing and filter helpers with `date` and `time`, including sport-gated normalization and reset rules.
- [x] 1.2 Update the discovery filter UI to add a required date input and an optional exact time input that only activate when a sport is selected.
- [x] 1.3 Ensure clearing sport or date resets the dependent availability filter state and returns discovery pagination to page 1.

## 2. Availability-Aware Summary Query

- [x] 2.1 Extend the public discovery summary transport and shared query identity to accept optional availability inputs and return optional `availabilityPreview` data.
- [x] 2.2 Implement a service-layer availability-aware summary branch that preserves discovery ordering, filters venues by matching 60-minute place-sport availability, and slices results after filtering.
- [x] 2.3 Branch SSR prefetch behavior so non-availability discovery keeps the current persistent cache while availability-aware discovery bypasses the long-lived server cache.

## 3. Discovery Result Presentation

- [x] 3.1 Add a discovery-local card wrapper that composes the shared `PlaceCard` with a compact availability preview strip.
- [x] 3.2 Render the availability preview wrapper for list results during availability-aware searches while keeping non-availability searches visually unchanged.
- [x] 3.3 Keep list and map views on the same availability-filtered dataset for the active filter state.

## 4. Verification

- [x] 4.1 Add or update tests for availability filter normalization, summary query identity, service-level availability filtering, and availability preview mapping.
- [ ] 4.2 Manually smoke test `/courts`, province routes, and city routes with date-only and exact-time availability searches.
- [ ] 4.3 Run `openspec status --change availability-aware-public-courts-discovery` and `pnpm lint` before implementation signoff.
