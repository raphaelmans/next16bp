# [00-27] Google Place Form Enhancements

> Date: 2026-01-13
> Previous: 00-26-schedule-pricing-merge.md

## Summary

Added a cached countries API, expanded place addressing fields, and upgraded the owner place form with a Google Maps URL preview, country picker, and free-text city input. Documented the embed key setup and created agent plans for the PoC flow.

## Changes Made

### API

| File | Change |
|------|--------|
| `src/app/api/public/countries/route.ts` | Added public countries list endpoint with envelope response and long-term cache headers. |
| `src/app/api/poc/google-loc/route.ts` | Added PoC resolver for Google Maps URLs (redirect resolve + lat/lng parse + embed URL). |

### Database Schema

| File | Change |
|------|--------|
| `src/shared/infra/db/schema/place.ts` | Added `province` and `country` columns (default `PH`). |

### Backend DTO/Service

| File | Change |
|------|--------|
| `src/modules/place/dtos/place.dto.ts` | Added `province` and `country` to create/update inputs. |
| `src/modules/place/services/place-management.service.ts` | Persisted `province` and `country` with default `PH`. |

### Frontend

| File | Change |
|------|--------|
| `src/features/owner/schemas/place-form.schema.ts` | Added `province` + `country` fields with defaults; removed city list. |
| `src/features/owner/components/place-form.tsx` | Added country picker (countries API), moved lat/lng to map card, Google Maps paste preview, and city free-text input. |
| `src/features/owner/hooks/use-place-form.ts` | Passed province/country to create/update payloads; stopped forcing 0.0 coords. |
| `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` | Prefilled province/country defaults for edit. |
| `src/app/(public)/poc/google-loc/page.tsx` | Added PoC UI for URL → embed preview. |

### Docs & Plans

| File | Change |
|------|--------|
| `guides/client/references/14-google-maps-embed.md` | Added setup guide for Maps Embed API key. |
| `agent-plans/23-google-maps-embed-poc/*` | Added master plan, phase plan, and dev checklist. |
| `agent-plans/user-stories/23-google-maps-embed-poc/23-00-overview.md` | Added user story for the PoC. |
| `.env.example` | Added `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`. |
| `src/lib/env/index.ts` | Added env validation for embed key. |

## Key Decisions

- Use ISO2 country codes with default `PH` for storage and UI defaults.
- City is free-text to avoid mismatches with static lists.
- Countries list served from `public/assets/countries.json` via API with long-term caching.
- Google Maps preview uses embed API and resolves short URLs server-side.

## Next Steps

- [ ] Run DB migration to add `province` + `country` (assumed done externally).
- [ ] Optional: update discovery city filters to allow free-text input.

## Commands to Continue

```bash
pnpm dev
pnpm lint
pnpm build
```
