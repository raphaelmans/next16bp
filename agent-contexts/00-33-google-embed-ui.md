# [00-33] Google Embed UI

> Date: 2026-01-13
> Previous: 00-32-owner-sidebar-quick-links.md

## Summary

Integrated Google Maps embed previews into discovery, reservation, and place detail views. Added shared embed component with key-based fallback behavior and cleaned up map preview coordinates.

## Changes Made

### UI

| File | Change |
|------|--------|
| `src/shared/components/kudos/google-maps-embed.tsx` | Added shared Google Maps embed component with key/coords/query handling. |
| `src/shared/components/kudos/index.ts` | Exported `GoogleMapsEmbed`. |
| `src/features/discovery/components/court-map.tsx` | Replaced placeholder map view with embed preview and map link. |
| `src/app/(public)/courts/page.tsx` | Removed fake coordinate fallbacks for map view. |
| `src/features/reservation/components/booking-details-card.tsx` | Added location embed and map links in booking details. |
| `src/app/(public)/places/[placeId]/page.tsx` | Added compact location card with embed + map links. |

### Data

| File | Change |
|------|--------|
| `src/features/discovery/hooks/use-place-detail.ts` | Added latitude/longitude parsing to place detail data. |

### Planning

| File | Change |
|------|--------|
| `agent-plans/23-google-maps-embed-poc/23-00-overview.md` | Added Phase 5 public UI embeds. |
| `agent-plans/23-google-maps-embed-poc/23-02-embed-ui.md` | Added implementation plan for embeds. |
| `agent-plans/23-google-maps-embed-poc/google-maps-embed-ui-dev1-checklist.md` | Added dev checklist. |
| `agent-plans/context.md` | Logged embed UI planning update. |

## Key Decisions

- Treated discovery map view as a place preview (single centered embed) to avoid misleading multi-pin UI without a full maps SDK.
- Used query-based embed fallback when coordinates are missing to still show a useful map.
- Placed place detail location card in the right column for a compact UX.

## Next Steps

- [ ] Confirm `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` is set in `.env.local` for embed rendering.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
