# [00-78] Organization Logo Visibility

> Date: 2026-01-21
> Previous: 00-77-owner-onboarding-verification.md

## Summary

Implemented organization logo visibility across owner and public surfaces, including data wiring for logo URLs, branded place cards, and a top-overlay logo + title in the place detail hero. Added a high-visibility logo upload card in the owner places hub and documented the work with a dedicated agent plan.

## Changes Made

### Backend/Data

| File | Change |
|------|--------|
| `src/modules/place/repositories/place.repository.ts` | Added `organizationLogoUrl` to list/detail payloads and helper to map org logos per place. |

### Frontend

| File | Change |
|------|--------|
| `src/shared/components/kudos/place-card.tsx` | Added logo badge overlay, fallback initials, and skeleton badge placeholder. |
| `src/features/discovery/hooks/use-discovery.ts` | Mapped `organizationLogoUrl` into `PlaceSummary.logoUrl`. |
| `src/features/discovery/hooks/use-place-detail.ts` | Added `logoUrl` to detail model. |
| `src/features/discovery/components/photo-gallery.tsx` | Added `topOverlay` slot for hero branding. |
| `src/app/(public)/places/[placeId]/page.tsx` | Rendered logo + name + trust badges in hero top overlay. |
| `src/app/(owner)/owner/places/page.tsx` | Added organization logo upload card with preview + upload flow. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/49-organization-logo-ux/49-00-overview.md` | Created master plan for owner logo visibility. |
| `agent-plans/49-organization-logo-ux/49-01-owner-places-logo-upload.md` | Added phase details for logo upload card. |
| `agent-plans/49-organization-logo-ux/organization-logo-ux-dev1-checklist.md` | Added dev checklist. |

## Key Decisions

- Placed logo upload in `My Places` for higher visibility over settings.
- Used a floating logo badge to keep the cover photo primary while adding brand recognition.
- Kept logo removal out of scope pending backend support.

## Next Steps

- [ ] Run `pnpm lint` and `TZ=UTC pnpm build`.
- [ ] QA logo upload on `/owner/places` and public card/hero rendering.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
