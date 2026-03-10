# SEO, Routing, And Metadata

## Index route

`src/app/(public)/guides/page.tsx` is intentionally small:

- It computes canonical URL data.
- It exports `metadata`.
- It renders `GuidesIndexPage` with `GUIDE_ENTRIES`.

This is the right App Router shape for a feature-owned public index page.

## Detail route

`src/app/(public)/guides/[slug]/page.tsx` handles the rest of the public SEO contract:

- `dynamicParams = false`
- `generateStaticParams()` from `GUIDE_ENTRIES`
- `generateMetadata()` from guide data
- `notFound()` for invalid slugs
- structured data injection

That makes the guide pages statically enumerable and metadata-driven from the same source of truth.

## Structured data

Both the generic and interactive guide pages include JSON-LD for:

- `Article`
- `BreadcrumbList`
- `FAQPage`

This is a strong replication choice because the guides are clearly search-oriented and FAQ-heavy.

The route also escapes `<` in the serialized JSON-LD string before injection:

```ts
JSON.stringify(structuredData).replace(/</g, "\\u003c")
```

Keep that exact safety step.

## Canonical handling

The implementation builds canonical URLs from shared route helpers plus a canonical origin helper.

Replicate this pattern:

- Use route helpers to avoid stringly-typed URLs.
- Use one canonical-origin helper so local, preview, and production environments stay consistent.

## Why metadata stays in the route

Keep metadata generation in the route layer instead of inside feature components because:

- It matches Next.js App Router conventions.
- It keeps route-specific concerns at the boundary.
- It avoids leaking Next.js route APIs into otherwise portable feature components.

## Replication checklist

For each guide route in the new repo:

1. Make the page a Server Component.
2. Load guide metadata from one registry.
3. Export `generateStaticParams()`.
4. Export `generateMetadata()`.
5. Return `notFound()` when lookup fails.
6. Inject JSON-LD from the same guide data used for rendering.

## Optional future enhancement

If the guide set grows, you can extract structured-data builders into a shared feature helper. The current inline helper approach is still reasonable because the page has only one route-specific SEO surface.
