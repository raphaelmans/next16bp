## ADDED Requirements

### Requirement: First page discovery results are server-prefetched and hydrated
The public courts discovery list SHALL render the initial page of results from server-prefetched Tier 1 summary data so the first page is available in the initial HTML response and can be hydrated by the client without waiting for a duplicate client fetch.

#### Scenario: First page load for the base courts route
- **WHEN** a user requests the public `/courts` discovery page
- **THEN** the server returns HTML that contains the first page of Tier 1 summary results for the active filter state

#### Scenario: First page load for a location-scoped discovery route
- **WHEN** a user requests a province or city-scoped public courts discovery route
- **THEN** the server resolves the location filters and returns HTML that contains the first page of Tier 1 summary results for that location

#### Scenario: Client hydration after server prefetch
- **WHEN** the courts discovery page hydrates on the client
- **THEN** the client query layer SHALL reuse the prefetched Tier 1 summary results for the current page instead of showing an initial list loading state

### Requirement: Pagination remains client-driven after hydration
After the first page is hydrated, the public courts discovery list SHALL continue pagination on the client using the same Tier 1 query contract, keep the previous page visible while the next page is loading, and support prefetching the next page when a subsequent page is available.

#### Scenario: Navigating to the next page
- **WHEN** a user changes the discovery page from one result page to the next
- **THEN** the previous page remains visible until the next page data resolves

#### Scenario: Next page is eligible for prefetch
- **WHEN** the current discovery page indicates that another results page exists
- **THEN** the client may prefetch the next page using the same Tier 1 query identity used by the active page

#### Scenario: Filter change resets client pagination
- **WHEN** a user changes province, city, sport, amenity, verification, or search filters
- **THEN** the discovery list returns to the first results page for the new filter state

### Requirement: Card enrichment loads progressively and independently from summary results
The public courts discovery list SHALL render Tier 1 summary cards immediately and load Tier 2 media and metadata in independent progressive batches so summary rendering is not blocked by enrichment fetches.

#### Scenario: Tier 1 summaries resolve before Tier 2 enrichments
- **WHEN** Tier 1 summary results are available and Tier 2 enrichment requests are still pending
- **THEN** the discovery list renders summary cards with per-card loading placeholders for enrichment fields

#### Scenario: Tier 2 enrichment fails for a visible batch
- **WHEN** a Tier 2 media or metadata request fails for a visible card batch
- **THEN** the Tier 1 summary cards remain rendered and usable without a page-level failure state

#### Scenario: Tier 2 enrichment is limited to visible card batches
- **WHEN** the discovery list contains multiple cards across the current page
- **THEN** Tier 2 enrichment requests are issued for visible batches instead of waiting for all cards on the page to enrich before rendering

### Requirement: Tier 1 discovery summaries support location-scoped server caching and revalidation
Tier 1 summary data for the public courts discovery list SHALL support server-side caching and on-demand revalidation scoped to discovery list data, province, and city so location-focused browsing can reuse warm results and relevant write paths can invalidate affected caches.

#### Scenario: Reusing a cached location-scoped discovery page
- **WHEN** a user revisits the same discovery route and filter state within the configured Tier 1 cache window
- **THEN** the server may serve cached Tier 1 summary data for that location instead of recomputing it on every request

#### Scenario: Place or court data changes affect visible discovery summaries
- **WHEN** a write operation changes public discovery-visible summary data for a venue in a province or city
- **THEN** the affected location-scoped Tier 1 discovery cache entries are marked for revalidation

#### Scenario: A venue changes its province or city
- **WHEN** a write operation moves a venue from one discovery location scope to another
- **THEN** revalidation covers both the previous and the new location-scoped Tier 1 discovery cache entries
