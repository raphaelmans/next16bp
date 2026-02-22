## Context

The public venue route currently delegates rendering to a client page view that fetches place details after hydration. This delays visible venue content and creates a perceived single request waterfall even though parts of the page are independently queryable. SEO and first paint quality are also constrained because primary page content is not rendered from server data in the initial HTML.

The migration needs to preserve existing booking behavior, canonical slug redirects, and structured data while changing rendering orchestration to SSR/ISR-first composition with section-level streaming.

## Goals / Non-Goals

**Goals:**
- Server-render venue core content for first paint and SEO.
- Use ISR for public venue content with a one-hour revalidation window.
- Split secondary sections (courts and venue details) into parallel streamed server boundaries.
- Keep availability studio as the only dynamically loaded client-only section.
- Preserve existing route behavior (`/venues/[placeId]`), structured data, and redirect semantics.

**Non-Goals:**
- Rewriting booking business logic, availability engines, or reservation flow contracts.
- Introducing backend schema or tRPC router changes.
- Redesigning UX beyond load orchestration and section boundary placement.

## Decisions

1. **Adopt server-composed page rendering and pass typed props into client islands.**
   - Rationale: Keeps SEO-critical and crawlable content in initial HTML while reducing client bootstrap blocking.
   - Alternative considered: Keep current client page and prefetch with hydration cache. Rejected because it still gates visible content behind hydration.

2. **Split page data into three server loader paths: core place, courts section, venue details section.**
   - Rationale: Enables section-level parallel streaming and independent fallback rendering.
   - Alternative considered: Keep single `place.getByIdOrSlug` object and map in sections. Rejected because it preserves one fetch gate and weakens perceived concurrency.

3. **Set route-level ISR to `revalidate = 3600`.**
   - Rationale: Balances freshness for public venue metadata with cache efficiency.
   - Alternative considered: 60s or 300s. Rejected for higher regeneration churn versus current update frequency.

4. **Keep availability studio in a dedicated client component loaded via `next/dynamic` with `ssr: false`.**
   - Rationale: Availability is interaction-heavy and query-dense; isolating it prevents hydration cost from blocking core content.
   - Alternative considered: SSR availability shell and hydrate full booking section immediately. Rejected due to higher initial JS and coupling.

5. **Preserve canonical redirect and metadata generation at route boundary.**
   - Rationale: Maintains existing URL canonicalization and search indexing behavior.
   - Alternative considered: Move redirect into client. Rejected because canonical correctness must occur before content render.

## Risks / Trade-offs

- **[Risk] Section duplication of transforms between metadata and page loaders** -> **Mitigation:** centralize mapping helpers and typed server loader outputs.
- **[Risk] Increased component count and file surface area** -> **Mitigation:** keep strict section boundaries and feature-local naming.
- **[Risk] Streaming fallbacks could feel jumpy on slow networks** -> **Mitigation:** provide stable section skeletons with fixed layout heights.
- **[Risk] Dynamic availability studio could delay booking readiness for power users** -> **Mitigation:** use lightweight loading shell and immediate mount after first paint.

## Migration Plan

1. Create server-first venue page composer and section server components.
2. Introduce split server loaders for core, courts, and venue details.
3. Move availability rendering behind a dynamic client-only entry component.
4. Switch route page to new composer and set ISR revalidation.
5. Remove page-level place fetch gate from initial client render path.
6. Validate route behavior, SEO output, and booking interactions with lint + manual smoke matrix.

Rollback strategy: revert route to previous `renderPlaceDetailPage()` implementation and remove new server section wiring. No data migration rollback is required.

## Open Questions

- None for this iteration; open-play summary remains out of scope for the streamed venue details section.
