# [00-86] Place Detail Listing Help UI

> Date: 2026-01-21
> Previous: 00-85-curated-places-export.md

## Summary

Improved the public place detail page (non-bookable venues) to restore player-first hierarchy while keeping owner/admin actions discoverable but subtle. Replaced the loud claim/removal cards with a lightweight "Listing help" panel, added clearer CTA affordance, and adjusted the photo gallery click target to avoid nested interactive elements.

## Changes Made

### UI/UX

| File | Change |
| --- | --- |
| `src/app/(public)/places/[placeId]/page.tsx` | Added hero CTAs for directions/call when bookings are unavailable; moved Location above owner tools; replaced claim/removal cards with a subtle "Listing help" panel including icons and link-style CTAs. |
| `src/features/discovery/components/photo-gallery.tsx` | Reworked main image click target to a transparent overlay button to prevent nested interactive elements and allow safe overlay CTAs. |

### Tooling / Validation

| Command | Result |
| --- | --- |
| `pnpm biome format --write src/app/(public)/places/[placeId]/page.tsx` | Formatted file after UI tweaks |
| `pnpm lint` | Passed (Biome check) |

## Key Decisions

- Use progressive disclosure via a lightweight help panel (instead of full cards/accordion) to keep owner/admin actions from competing with player actions.
- Provide explicit CTA affordance (link-style action + arrow) so secondary actions still read as actionable.

## Next Steps (if applicable)

- [ ] Quick visual smoke test at 375px and desktop for spacing and hierarchy.

## Commands to Continue

```bash
pnpm dev
```
