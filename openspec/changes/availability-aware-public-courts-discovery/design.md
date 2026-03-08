## Context

`hydrate-public-courts-discovery` already defines the desired baseline for public discovery: Tier 1 server-prefetched summaries, shared query identity between server and client, progressive card enrichment, and location-scoped caching. The current discovery surface can filter by location, sport, amenities, and verification state, but it still treats availability as a place-detail concern. The repo already has a place-sport availability query path and booking UI primitives, but discovery summaries do not carry availability inputs or availability preview data.

This change crosses route parsing, discovery query identity, service orchestration, and card presentation. It also changes freshness expectations, because venue availability is substantially more volatile than discovery summary metadata.

## Goals / Non-Goals

**Goals:**
- Let players narrow `/courts` results by province, city, sport, date, and optional exact start time.
- Require `sportId` before availability-aware filtering activates so the feature aligns with the existing place-sport availability contract.
- Return only venues that have a matching 60-minute bookable slot for the requested date or exact time.
- Surface a compact availability preview with each matching discovery card.
- Preserve the current hydrated discovery flow and shared list/map dataset semantics.

**Non-Goals:**
- Add cross-sport availability matching when no sport is selected.
- Add a user-selectable duration filter in discovery.
- Rebuild the shared `PlaceCard` API for discovery-specific availability UI.
- Introduce long-lived caching for date-aware availability results.
- Change place-detail booking flows or court-detail booking semantics.

## Decisions

### Create a follow-on change that depends on hydrated discovery

This work should remain a separate OpenSpec change instead of widening `hydrate-public-courts-discovery`. The existing change explicitly treats list-card availability as out of scope, and this feature is a second layer on top of that baseline.

Alternative considered:
- Fold the new behavior into `hydrate-public-courts-discovery`. Rejected because it blurs the boundary between static summary hydration and dynamic availability filtering.

### Keep availability filters sport-gated and sanitize invalid URL states

Availability-aware discovery will only activate when a `sportId` is present. Date and time inputs belong in URL state, but if a URL arrives with `date` or `time` and no sport, the server and client filter normalization paths must ignore the availability inputs.

Alternative considered:
- Search across every sport when sport is missing. Rejected because the current availability API is place-sport scoped and multi-sport fan-out would add avoidable query and UI complexity.

### Encode availability filters as `date=YYYY-MM-DD` and `time=HH:mm`

Discovery URL state should carry a local day key and a local wall-clock time, not a full ISO timestamp. This keeps URLs readable, stable, and aligned with the existing date selection model already used across discovery and booking surfaces.

Alternative considered:
- Use ISO datetime values in the URL. Rejected because it adds timezone noise to a UI that is fundamentally date- and time-slot-driven.

### Extend the discovery summary contract instead of adding a second result endpoint

The existing public discovery summary transport should accept optional availability inputs and return optional `availabilityPreview` data. That keeps one summary query identity for SSR prefetch, hydration, list rendering, and map rendering.

Alternative considered:
- Add a separate `listAvailabilitySummary` transport. Rejected because it would split Tier 1 discovery ownership and duplicate filter normalization, hydration, and view-sharing logic.

### Resolve availability filtering in the service layer over ranked discovery candidates

Repository ordering for discovery summaries should remain the source of truth for candidate ranking. When availability filters are active, the service layer should:
- fetch candidate venues in discovery order
- skip non-reservable or non-matching sport candidates
- evaluate place-sport availability with bounded concurrency
- keep only matched venues
- attach `availabilityPreview`
- slice the filtered set into the requested page after filtering

This preserves exact pagination semantics without pushing booking logic into repository SQL.

Alternative considered:
- Filter only the already paged list client-side. Rejected because it produces incomplete pages, incorrect totals, and unstable pagination.

### Return availability preview in summary data and render it via a discovery-local wrapper

The summary result should expose an additive `availabilityPreview` object with the requested date, optional requested time, earliest matched start time, and match count. Discovery should render that preview in a wrapper component around the shared `PlaceCard`, leaving the generic card contract unchanged.

Alternative considered:
- Expand the shared `PlaceCard` component with discovery-only availability props. Rejected because the shared card is used in multiple contexts and should not absorb discovery-specific behavior.

### Use no persistent server cache for availability-aware discovery summaries

The current one-week `unstable_cache` policy is appropriate for location-scoped discovery metadata, but not for reservation-sensitive availability. When `date` or `time` filters are present, the server should still prefetch the first page for hydration but must bypass the long-lived persistent cache and use short client freshness only.

Alternative considered:
- Reuse the current one-week cache tags for availability-aware queries. Rejected because stale availability would be visible for too long and invalidate the value of the new filters.

### Keep list and map on the same filtered dataset, but limit preview UI to list cards in v1

Both views should use the same availability-filtered summary dataset so switching views preserves the active result set. The v1 availability preview strip is required for list cards; map rendering only needs the filtered markers and existing popover/card treatment.

Alternative considered:
- Add separate availability preview UI to both list and map immediately. Rejected because it increases UI surface area without changing the core query behavior.

## Risks / Trade-offs

- [Availability filtering scans many discovery candidates] → Use bounded concurrency, preserve repository ordering, and keep the v1 matching contract simple: one sport, one date, optional exact time, fixed 60-minute duration.
- [Date-aware discovery URLs arrive in invalid combinations] → Normalize at the route boundary and in client filter helpers so availability inputs are ignored without `sportId`, and `time` is cleared when `date` is removed.
- [Summary and availability freshness policies diverge] → Branch cache behavior explicitly so non-availability discovery keeps the current long-lived server cache while availability-aware searches do not.
- [Discovery card UI becomes tightly coupled to shared card internals] → Add a feature-local wrapper instead of modifying the shared `PlaceCard` contract.
- [Exact pagination is more expensive than current summary paging] → Accept the v1 compute trade-off to keep user-facing result correctness, and defer deeper optimization until real-world usage justifies it.

## Migration Plan

1. Create the new capability spec and tasks as a follow-on change to `hydrate-public-courts-discovery`.
2. Extend discovery URL-state and summary input normalization with `date` and `time`.
3. Add the availability-aware summary service branch and preview model while preserving the existing non-availability summary path.
4. Update SSR prefetch to branch cache behavior based on whether availability filters are active.
5. Add the discovery-local card wrapper and list integration, while keeping list/map on the same filtered dataset.
6. Validate route behavior, query identity, availability filtering, and manual smoke cases for base, province, and city discovery routes.

Rollback strategy:
- Remove the availability-aware branch from discovery summary normalization and transport, returning the public discovery flow to the current hydrated location/sport filtering behavior.

## Open Questions

- None for the initial implementation slice.
