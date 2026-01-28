# [01-26] Availability Studio DnD

> Date: 2026-01-28
> Previous: 01-25-ui-enhancements-jan28.md

## Summary

Implemented the owner Availability Studio with drag-and-drop block creation, custom block dialog, block move/resize, and import overlay correction. Added a reschedule API for court blocks, wired import review deep-links to the studio, and resolved lint issues before running production build.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(owner)/owner/bookings/page.tsx` | Added Availability Studio UI, DnD palette, custom block dialog, block move/resize, and import overlay with draft row drag + commit/discard. |
| `src/modules/court-block/services/court-block.service.ts` | Added `updateRange` service with overlap checks and walk-in repricing. |
| `src/modules/court-block/court-block.router.ts` | Added `updateRange` mutation. |
| `src/modules/court-block/dtos/update-court-block.dto.ts` | Added update DTO schema and type. |
| `src/modules/court-block/dtos/index.ts` | Exported update DTO. |
| `src/app/(owner)/owner/import/bookings/[jobId]/page.tsx` | Added “Fix in studio” action linking to overlay mode. |
| `src/shared/lib/app-routes.ts` | Added owner bookings route constant. |
| `src/features/owner/components/owner-sidebar.tsx` | Added sidebar nav item for Availability Studio. |

### Import/Lint Fixes

| File | Change |
|------|--------|
| `src/modules/bookings-import/lib/ai-ics-mapping.ts` | Removed useless switch case to satisfy lint. |
| `src/app/(public)/courts/[id]/opengraph-image.tsx` | Added SVG title for accessibility lint. |
| `src/app/(public)/list-your-venue/opengraph-image.tsx` | Added SVG title for accessibility lint. |
| `src/app/icon.tsx` | Added SVG title for accessibility lint. |
| `src/app/opengraph-image.tsx` | Added SVG title for accessibility lint. |
| `src/app/twitter-image.tsx` | Added SVG title for accessibility lint. |
| `src/components/availability-empty-state.tsx` | Removed invalid role usage. |
| `src/shared/components/layout/onboarding-shell.tsx` | Import ordering per Biome. |
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Import ordering per Biome. |

### Dependencies

| File | Change |
|------|--------|
| `package.json` | Added `@dnd-kit/core` and `@dnd-kit/utilities`. |
| `pnpm-lock.yaml` | Updated lockfile for new deps. |

## Key Decisions

- Primary creation UX is drag-and-drop preset widgets instead of drag-to-create ranges, to align with 60-minute snapping and reduce gesture conflicts.
- Reschedule support added as a dedicated `courtBlock.updateRange` endpoint rather than cancel + recreate to preserve block identity and reduce failure modes.
- Import correction uses overlay mode in the studio to provide calendar context and reuse existing update/commit endpoints.

## Next Steps (if applicable)

- [ ] Optional: add multi-court grid view for faster venue-level operations.
- [ ] Optional: add drag-to-create range for power users (with clear gesture affordance).

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
