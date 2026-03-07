## Context

The public courts discovery list currently starts as a client-only experience. The route shell renders immediately, but the first results page does not appear until the client issues the summary query after hydration. Card media and metadata are already split from the summary query, but they still load as a single page-wide enrichment step rather than a deliberately progressive flow. The repo already has TanStack Query, a shared custom query layer, tRPC React Query hydration helpers in `src/trpc/server.ts`, server-safe province/city resolution utilities, and existing server cache patterns built with `unstable_cache` and `revalidateTag`.

This change crosses route boundaries, discovery hooks, server cache helpers, and write-path invalidation. It also has performance implications, so a design document is warranted before implementation.

## Goals / Non-Goals

**Goals:**
- Render the first page of public courts discovery results from server-prefetched Tier 1 data.
- Hand off the prefetched Tier 1 data to TanStack Query so the client takes over pagination and filter-driven refetches without query identity drift.
- Keep progressive loading semantics for list cards by making Tier 2 enrichment independent from Tier 1 rendering.
- Add server-side cache and revalidation behavior for Tier 1 discovery data with province and city as the primary invalidation scopes.

**Non-Goals:**
- Redesign the public courts UI or change the public discovery feature scope beyond first-page hydration and progressive enrichment.
- Add list-card real-time availability or place-detail prefetching in this change.
- Replace current offset pagination with cursor pagination.
- Introduce one network request per card for media or metadata.

## Decisions

### Use SSR prefetch plus TanStack hydration for Tier 1 only

The server will prefetch only the Tier 1 summary query for the active route and filter state, dehydrate it into the initial response, and let the client continue with the same query key after hydration. This matches the target pattern without overfetching enrichment data on the server.

Alternative considered:
- Prefetch both summary and card enrichment on the server. Rejected because it increases server work for the least critical data, makes cache invalidation broader, and reduces the value of progressive rendering.

### Split shared discovery query primitives into a server-safe query options layer

The current discovery stack is client-oriented. To support SSR prefetch and client hydration with one query identity, the query key, input normalization, and queryOptions factory for Tier 1 must live in a server-safe module that can be imported by both the route prefetch path and the client hooks.

Alternative considered:
- Reuse the existing client-only discovery hook module directly on the server. Rejected because the current modules are marked `"use client"` and are not safe as a shared SSR source of truth.

### Resolve province and city on the server before Tier 1 prefetch

Route-level search params and location routes will resolve province and city through the existing server-safe PH location utilities before building the Tier 1 input. This keeps cache keys stable and avoids a wasted “slug unresolved” client fetch on first load.

Alternative considered:
- Continue resolving province and city only after the client PH locations query loads. Rejected because it delays first meaningful results and weakens cache reuse for location-focused discovery.

### Keep Tier 2 batched by visible chunk, not by card

Tier 2 enrichment will be requested for visible ID batches and rendered independently as each batch resolves. This preserves the progressive-loading UX while keeping the backend on batched `...ByIds` queries and avoiding N+1 patterns that would increase network and database round trips.

Alternative considered:
- Fetch media/meta per card. Rejected because it conflicts with the existing repository batching approach and the Postgres guidance to avoid N+1 query shapes.

### Use server cache tags for discovery list summary scopes

Tier 1 summary data will be cached on the server with a one-week TTL and tagged for broad list scope plus province/city scopes. Relevant write paths will own tag revalidation. Client invalidation remains separate and only handles client-owned cache behavior after mutations.

Alternative considered:
- Rely on client-side staleTime only. Rejected because it does not reduce first-request server work and does not satisfy the desired SSR-plus-revalidation architecture.

## Risks / Trade-offs

- [Shared queryOptions drift between server and client] → Centralize Tier 1 query primitives in one server-safe module and keep client hooks as thin wrappers.
- [Route prefetch introduces duplicate server fetches] → Use one prefetch path per route render and keep normalization deterministic so hydration hits the same cache entry.
- [Tier 2 visible batching becomes too granular] → Use chunked batching keyed by visible groups rather than element-by-element fetches.
- [Revalidation misses a location move] → Revalidation helpers must accept previous and next province/city scopes and invalidate both when location membership changes.
- [One-week TTL serves stale summaries too long without mutations] → Use tag-based on-demand revalidation from write paths for correctness and reserve the long TTL for cache reuse, not data freshness guarantees by itself.

## Migration Plan

1. Extract server-safe Tier 1 discovery query primitives and normalization helpers.
2. Add a server-side Tier 1 accessor with `unstable_cache` and discovery cache tags.
3. Wrap public courts discovery routes in server prefetch plus hydration boundary flow.
4. Update the client discovery list to consume hydrated Tier 1 data, use client pagination with previous-page retention, and prefetch the next page.
5. Refactor Tier 2 card enrichment to visible-batch progressive loading.
6. Add discovery list revalidation helpers and wire them into relevant write paths.
7. Validate with lint and manual smoke for `/courts` plus province/city list entry routes.

Rollback strategy:
- Revert the route wrapper to the existing client-only discovery page and disable the new discovery cache/revalidation helper usage.

## Open Questions

- Whether the base `/courts` page should receive the same one-week server cache TTL as province/city routes or use a shorter TTL because it is broader and likely changes more often.
- Whether map view should share the exact same Tier 1 hydrated query result as list view or maintain a view-specific composition layer over the same data.
