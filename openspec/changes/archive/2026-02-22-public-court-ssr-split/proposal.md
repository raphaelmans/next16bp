## Why

The public venue detail route currently relies on a client fetch for visible content after hydration, which delays meaningful paint and creates a perceived single waterfall request pattern. We need SEO-critical venue content to be server-rendered with ISR while preserving interactive booking behavior.

## What Changes

- Refactor the public venue detail route to a server-composed rendering model.
- Server-render and cache (ISR) venue core content used for SEO and first paint.
- Stream non-blocking venue sections in parallel using independent server suspense boundaries.
- Keep availability studio as the only dynamically loaded client-only section.
- Preserve canonical slug redirect behavior and structured data output.
- Remove page-level client gating for primary venue content.

## Capabilities

### New Capabilities
- `public-venue-ssr-streaming`: Public venue detail page rendering contract for SSR-first core content, parallel streamed secondary sections, and client-only dynamic availability studio.

### Modified Capabilities
- `discovery`: Public place/venue detail rendering requirements now mandate SSR/ISR for SEO-critical content and section-level parallel streaming boundaries.

## Impact

- `src/app/(public)/venues/[placeId]/page.tsx`
- `src/features/discovery/pages/place-detail-page.tsx`
- `src/features/discovery/place-detail/components/place-detail-page-view.tsx`
- New/updated discovery place-detail section components for server streaming and dynamic availability entry
- Public discovery route runtime behavior and caching strategy for venue detail pages
