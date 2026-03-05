---
tags:
  - agent-context
  - frontend/owner
  - backend/google-loc
date: 2026-03-05
previous: 02-09-mobile-desktop-booking-consistency.md
related_contexts:
  - "[[00-27-google-place-form]]"
  - "[[00-52-google-loc-client]]"
---

# [02-10] Interactive Map Picker for Venue Location

> Date: 2026-03-05
> Previous: 02-09-mobile-desktop-booking-consistency.md

## Summary

Added an interactive Google Maps picker to the venue create/edit form. Users can search an address (Philippines-scoped, multi-result selection) or click the map to drop a pin. The interactive map is lazy-loaded behind a button click — the default view uses the free Maps Embed API to avoid cost. Geocoding is server-side with aggressive Redis rate limiting (3 req/hour per user). Search is disabled on the edit form (pin-only adjustment).

## Related Contexts

- [[00-27-google-place-form]] - Original Google Maps URL paste flow for place form
- [[00-52-google-loc-client]] - Google location client module structure

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/owner/components/place-map-picker.tsx` | New component: lazy-loaded interactive map with embed preview, search bar, result selection, and click-to-pin |
| `src/features/owner/components/place-form.tsx` | Integrated map picker into Map card; wrapped URL paste flow in Collapsible fallback; pass `searchEnabled={!isEditing}` |
| `src/features/owner/components/place-form-hooks.ts` | Added `handleMapPinChange`, `latitudeValue`, `longitudeValue` to hook return |
| `src/lib/shared/infra/ratelimit/config.ts` | New `geocodeSearch` tier: 3 req/1h sliding window |
| `src/lib/modules/google-loc/dtos/google-loc.dto.ts` | Added `GoogleLocGeocodeRequest/Result/Response` schemas (multi-result) |
| `src/lib/modules/google-loc/services/google-loc.service.ts` | Added `geocode()` method with `components=country:PH` filter, returns up to 5 results |
| `src/lib/modules/google-loc/http/google-loc-route-handler.ts` | Added `handleGoogleLocGeocode` with `geocodeSearch` rate limit tier per userId |
| `src/app/api/v1/google-loc/geocode/route.ts` | New POST route for geocoding |
| `src/common/clients/google-loc-client/index.ts` | Added `useGoogleLocGeocodeMutation` hook and `geocodeClient.geocode()` |
| `src/common/clients/google-loc-client/query-keys.ts` | Added `geocode` query key |

### Dependencies

| Package | Change |
|---------|--------|
| `@vis.gl/react-google-maps` | Added v1.7.1 — Google's official React wrapper for Maps JS API |

## Tag Derivation (From This Session's Changed Files)

- `frontend/owner` — place-form, place-form-hooks, place-map-picker
- `backend/google-loc` — geocode route, service, DTOs, rate limit config

## Key Decisions

- **Lazy-load interactive map** — Default shows free Maps Embed API ($0); interactive JS map ($7/1K loads) only loads when user clicks "Edit/Set pin location"
- **Server-side geocoding** — Geocoding goes through `/api/v1/google-loc/geocode` instead of client-side Google Maps JS, keeping `GOOGLE_MAPS_API_KEY` server-only and enabling Redis rate limiting
- **3 req/hour rate limit** — `geocodeSearch` tier via Upstash Redis, per authenticated userId. Tightest tier in the system since venue setup is infrequent
- **Philippines-scoped results** — `components=country:PH` hard-filters geocoding to PH only (not just region bias)
- **Multi-result selection** — Returns up to 5 results for user to choose from, preventing false matches and wasted rate-limit budget
- **No search on edit** — Edit form only shows click-to-pin; search is create-only to limit abuse surface

## Prerequisites

- Enable **Maps JavaScript API** on the Google Cloud key used for `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`
- Enable **Geocoding API** on the key used for `GOOGLE_MAPS_API_KEY`

## Next Steps

- [ ] Verify `mapId` "place-map-picker" works with AdvancedMarker (may need Cloud-based map styling enabled in Google Cloud Console)
- [ ] Consider adding a "Done editing" button to switch back to embed view after pin placement

## Commands to Continue

```bash
pnpm dev
pnpm lint
```
