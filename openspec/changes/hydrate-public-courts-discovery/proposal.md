## Why

The public `/courts` discovery experience currently renders as a client-only list that waits for the first summary query after hydration, then batches all card enrichment for the page together. That makes first-load latency more visible, weakens location-focused cache reuse for province/city browsing, and does not take advantage of the server rendering and revalidation primitives already available in the app.

## What Changes

- Server-prefetch the first page of public courts discovery results and dehydrate that data into the initial HTML response.
- Standardize shared Tier 1 query options so the same query key and fetch contract are used by both the server prefetch path and the client query path.
- Keep pagination client-driven after hydration, including preserving the previous page while the next page loads and prefetching the next page opportunistically.
- Convert list-card enrichment into progressive Tier 2 loading that batches visible venue IDs, renders independently from Tier 1, and does not break list rendering on partial failures.
- Add explicit server-side cache and revalidation rules for Tier 1 discovery data, focused on province and city filter scopes.

## Capabilities

### New Capabilities
- `public-courts-discovery-list`: Server-prefetched, hydrated, progressively enriched public courts discovery with location-scoped caching and revalidation.

### Modified Capabilities

## Impact

- Affected surfaces: public `/courts` discovery routes, province/city discovery entry pages, and discovery list pagination behavior.
- Affected systems: Next.js server rendering and cache tagging, TanStack Query hydration, public discovery query adapters, and write-path revalidation for place/court/verification updates.
- Affected code areas: `src/app/(public)/courts/**`, `src/features/discovery/**`, `src/trpc/server.ts`, and server-side cache helpers tied to place and court mutations.
