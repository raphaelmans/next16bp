# [01-02] SEO Foundation

> Date: 2026-01-23
> Previous: 01-01-react-best-practice-fixes.md

## Summary

Implemented a full SEO foundation: crawl controls, sitemap generation, canonical host alignment, structured data, and new location landing pages. Added missing legal/company pages, improved metadata/H1s, and enforced canonical routing/404 handling for venues.

## Changes Made

### Crawl & Indexation

| File | Change |
|------|--------|
| `src/app/robots.ts` | Added robots rules with sitemap + disallow list. |
| `src/app/sitemap.ts` | Generated dynamic sitemap with places, orgs, and location pages. |
| `src/app/layout.tsx` | Added structured data + production-only indexing control. |
| `src/proxy.ts` | Redirected `/venues` list to `/courts` canonical. |

### SEO Pages & Metadata

| File | Change |
|------|--------|
| `src/app/page.tsx` | Server metadata wrapper for homepage. |
| `src/app/home-page-client.tsx` | Client homepage with new H1 hero. |
| `src/app/(public)/courts/page.tsx` | Server metadata wrapper for courts list. |
| `src/app/(public)/courts/courts-page-client.tsx` | Reusable courts list client with initial filters. |
| `src/app/(public)/contact-us/page.tsx` | Added metadata and canonicals. |
| `src/app/(public)/org/[slug]/page.tsx` | Added OG/Twitter metadata + org JSON-LD. |
| `src/app/(public)/places/[placeId]/page.tsx` | Promoted venue name to H1. |

### Location Landing Pages

| File | Change |
|------|--------|
| `src/shared/lib/ph-location-data.server.ts` | Server-side PH locations loader + slug resolver. |
| `src/app/(public)/courts/locations/[province]/page.tsx` | Province landing page with metadata + filters. |
| `src/app/(public)/courts/locations/[province]/[city]/page.tsx` | City landing page with metadata + filters. |

### Legal & Company Pages

| File | Change |
|------|--------|
| `src/shared/lib/app-routes.ts` | Added public routes for about/blog/cookies. |
| `src/features/discovery/components/footer.tsx` | Routed footer links to app routes. |
| `src/app/(public)/about/page.tsx` | New about page. |
| `src/app/(public)/blog/page.tsx` | New blog placeholder. |
| `src/app/(public)/cookies/page.tsx` | Cookie policy page. |
| `src/app/(public)/terms/page.tsx` | Terms page. |
| `src/app/(public)/privacy/page.tsx` | Privacy page. |
| `src/app/(public)/list-your-venue/layout.tsx` | Canonical host alignment. |

### Indexing Controls

| File | Change |
|------|--------|
| `src/app/(auth)/layout.tsx` | Noindex auth routes. |
| `src/app/(protected)/layout.tsx` | Noindex protected routes. |
| `src/app/(owner)/layout.tsx` | Noindex owner routes. |
| `src/app/(admin)/layout.tsx` | Noindex admin routes. |
| `src/app/(public)/courts/[id]/schedule/layout.tsx` | Noindex schedule page. |
| `src/app/(public)/venues/[placeId]/schedule/layout.tsx` | Noindex schedule page. |

### Canonical/404 Handling

| File | Change |
|------|--------|
| `src/app/(public)/venues/[placeId]/page.tsx` | Server wrapper to return real 404s for unknown venues. |

## Key Decisions

- Chose `/courts` as the canonical list URL and redirected `/venues` list traffic.
- Generated sitemap entries for location pages using place province/city and local slug lookup.
- Added JSON-LD for the site and organization pages to strengthen structured data.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` and `TZ=UTC pnpm build` to validate changes.
- [ ] Add real blog content and optionally expand schema (e.g., SportsActivityLocation). 

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
