---
tags:
  - agent-context
  - frontend/discovery
  - frontend/org
date: 2026-03-08
previous: 03-03-courts-route-query-fixes.md
related_contexts:
  - "[[03-02-public-place-cache-invalidation]]"
  - "[[01-81-place-detail-composition-pass]]"
---

# [03-04] SEO Index Gating

> Date: 2026-03-08
> Previous: 03-03-courts-route-query-fixes.md

## Summary

Added a shared SEO indexability gate for public venue and organization surfaces to reduce sitemap pollution and stop thin pages from being advertised to Google. Venue detail metadata and org landing metadata now fall back to `noindex,follow` when a page lacks minimum quality signals, while `sitemap.xml` excludes those URLs entirely.

## Related Contexts

- [[03-02-public-place-cache-invalidation]] - Related public place surface work and sitemap-adjacent behavior for public venue pages.
- [[01-81-place-detail-composition-pass]] - Relevant because the venue detail metadata changes were applied in the place-detail page composition layer.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/common/seo-indexability.ts` | Added shared heuristics for indexable venue/org surfaces, including generic slug/name suppression and minimum quality checks. |
| `src/app/sitemap.ts` | Filtered venue and org sitemap entries using quality signals such as active courts, profile content, contact details, photos, and verification. |
| `src/features/discovery/pages/place-detail-page.tsx` | Returned `robots: { index: false, follow: true }` for thin public venue pages while preserving canonical and OG metadata. |
| `src/app/(public)/org/[slug]/page.tsx` | Returned `noindex,follow` metadata for low-value org pages such as org profiles without public venues/courts or profile content. |

### Documentation

| File | Change |
|------|--------|
| `agent-contexts/03-04-seo-index-gating.md` | Logged the SEO indexation cleanup work, decisions, and follow-up items. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery` from `src/features/discovery/pages/place-detail-page.tsx`
- `frontend/org` from `src/app/(public)/org/[slug]/page.tsx`

## Key Decisions

- Used quality gating instead of a blanket `noindex` on owned venues so strong venue pages can still be indexed.
- Suppressed generic placeholder slugs and names at the shared helper level so sitemap and metadata decisions stay consistent.
- Kept the fix on the main web SEO surfaces only and explicitly reverted the temporary mobile-route revalidation change because the mobile API is slated for deprecation.
- Treated location and discovery pages as the strong SEO layer, with venue/org pages earning indexation only when they have enough trust and completeness signals.

## Next Steps (if applicable)

- [ ] Deploy and confirm the reduced sitemap footprint in production.
- [ ] Re-submit `sitemap.xml` in Search Console and inspect a few strong owned venue URLs for live indexability.
- [ ] Review whether amenity-specific SEO should stay embedded in venue pages or get dedicated canonical landing pages later.

## Commands to Continue

```bash
pnpm exec biome check src/common/seo-indexability.ts src/app/sitemap.ts 'src/app/(public)/org/[slug]/page.tsx' src/features/discovery/pages/place-detail-page.tsx
```
