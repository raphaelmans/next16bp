# [00-83] Multi-Sport Copy

> Date: 2026-01-21
> Previous: 00-82-place-detail-cta-hierarchy.md

## Summary

Updated hard-coded marketing/UI copy across public pages so the product is positioned as pickleball-first but supports other sports courts. Avoided changes to dynamic/DB-driven content; only adjusted verbatim strings, metadata, and example placeholders.

## Changes Made

### Marketing / SEO Copy

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Updated metadata descriptions and expanded keywords beyond pickleball. |
| `src/app/page.tsx` | Updated value proposition to "court sports, starting with pickleball". |
| `src/app/opengraph-image.tsx` | Updated OG image tagline to multi-sport phrasing. |
| `src/app/twitter-image.tsx` | Updated Twitter image tagline to multi-sport phrasing. |
| `src/app/(public)/courts/[id]/opengraph-image.tsx` | Made court-detail OG copy sport-agnostic ("Book courts..."). |
| `src/features/reservation/components/owner-cta-section.tsx` | Changed owner CTA copy to "pickleball or multi-sport venue". |
| `src/shared/components/kudos/ad-banner.tsx` | Broadened ad copy while still highlighting pickleball. |
| `src/features/discovery/components/footer.tsx` | Updated footer label + link to avoid invalid `sportId` and still highlight pickleball via `?q=pickleball`. |

### UI Placeholders (Examples)

| File | Change |
|------|--------|
| `src/features/organization/components/organization-form.tsx` | Updated placeholder to multi-sport example. |
| `src/app/(admin)/admin/courts/new/page.tsx` | Updated placeholder to multi-sport example. |
| `src/app/(admin)/admin/courts/batch/page.tsx` | Updated placeholder to multi-sport example. |
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Updated placeholder to multi-sport example. |

## Key Decisions

- Keep the product positioning "pickleball-first" but explicitly mention broader support (e.g., "pickleball and other sports courts").
- Avoid relying on `sportId=pickleball` in URLs because the real app uses UUID sport IDs; use `?q=pickleball` for a durable pickleball highlight link.
- Leave seed data, docs, and DB-backed content untouched; only update hard-coded page verbatim.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
