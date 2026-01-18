# [00-56] Court Social Metadata

> Date: 2026-01-18
> Previous: 00-55-places-combobox-ui.md

## Summary

Implemented dynamic metadata and a route-specific Open Graph image for public court detail pages so social previews show court-specific text while preserving the global brand styling.

## Changes Made

### Metadata

| File | Change |
| --- | --- |
| `src/app/(public)/courts/[id]/page.tsx` | Added `generateMetadata` to fetch place data, build description, set canonical `/courts/<id>`, and point OG/Twitter to the route image. |

### Open Graph Image

| File | Change |
| --- | --- |
| `src/app/(public)/courts/[id]/opengraph-image.tsx` | Added a dynamic OG image that reuses the root styling with court name/location text. |

## Key Decisions

- Keep the OG image styling aligned with the root image and only swap the text to match the specific court.
- Use the canonical URL `/courts/<id>` for shared links.

## Next Steps (if applicable)

- [ ] Validate the social preview metadata with an OG/Twitter card checker.
- [ ] Consider applying the same metadata pattern to `/places/<id>` for consistency.

## Commands to Continue

```bash
pnpm dev
```
