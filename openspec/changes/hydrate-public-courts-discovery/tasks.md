## 1. Shared Tier 1 Query Foundation

- [ ] 1.1 Extract a server-safe normalization helper for public courts discovery filters, including province and city resolution for SSR entry points.
- [ ] 1.2 Create shared Tier 1 query key and queryOptions builders that can be used by both server prefetch and client discovery hooks.
- [ ] 1.3 Add a server-side Tier 1 summary accessor backed by `unstable_cache` with discovery list, province, and city cache tags.

## 2. Server Prefetch and Hydration

- [ ] 2.1 Add a server wrapper for the public courts discovery page that parses the current filter state, prefetches the first Tier 1 page, and renders a hydration boundary.
- [ ] 2.2 Apply the same prefetch and hydration flow to province and city discovery entry routes that render the shared courts discovery page.
- [ ] 2.3 Ensure the client discovery surface consumes hydrated Tier 1 data without showing an initial list loading state for the first page and keeps list and map on the same Tier 1 dataset.

## 3. Client Pagination and Progressive Tier 2 Loading

- [ ] 3.1 Update the Tier 1 client query flow to keep the previous page visible during pagination and prefetch the next page when more results exist.
- [ ] 3.2 Refactor Tier 2 media and metadata loading to request visible ID batches progressively rather than enriching the entire page at once.
- [ ] 3.3 Preserve independent loading and failure handling for Tier 2 so summary cards remain usable when enrichment is pending or partially failed.

## 4. Revalidation and Verification

- [ ] 4.1 Add discovery list revalidation helpers for location-scoped Tier 1 cache tags, including support for both previous and next province/city scopes.
- [ ] 4.2 Wire discovery list revalidation into relevant place, court, and verification write paths that affect public discovery-visible summary data.
- [ ] 4.3 Add or update tests for shared Tier 1 query identity, hydration handoff, progressive Tier 2 behavior, and location-scoped revalidation.
- [ ] 4.4 Run `pnpm lint` and perform manual smoke checks for `/courts` and province/city discovery routes before implementation signoff.
