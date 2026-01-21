# 00-96 Google Place ID Backfill

> Date: 2026-01-22
> Previous: 00-95-public-courts-lazy-details.md

## Summary

Added Google place ID support (`extGPlaceId`) to places, introduced a cached resolver for Google place IDs, updated admin Locate flows to store/display place IDs while removing manual lat/lng inputs, and wired a backfill script to populate missing IDs from name + lat/lng.

## Changes Made

### Database

| File | Change |
| --- | --- |
| `src/shared/infra/db/schema/place.ts` | Added `extGPlaceId` column + index. |
| `drizzle/0007_place_ext_g_place_id.sql` | Migration for `ext_g_place_id` column + index. |

### Google Maps Place ID

| File | Change |
| --- | --- |
| `src/shared/lib/google-maps/resolve-google-place-id.ts` | New resolver with Upstash caching and TTLs. |
| `src/app/api/poc/google-loc/route.ts` | Uses cached resolver for placeId fallback. |

### Admin Forms (Locate flow)

| File | Change |
| --- | --- |
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Save/placeId in form state, show in preview, remove editable lat/lng inputs. |
| `src/app/(admin)/admin/courts/new/page.tsx` | Save/placeId in form state, show in preview, remove editable lat/lng inputs. |
| `src/app/(admin)/admin/courts/batch/page.tsx` | Save/placeId per row, show in preview, remove editable lat/lng inputs. |
| `src/features/admin/schemas/admin-court-edit.schema.ts` | Added `extGPlaceId`. |
| `src/features/admin/schemas/curated-court.schema.ts` | Added `extGPlaceId`. |
| `src/features/admin/schemas/curated-court-batch.schema.ts` | Added `extGPlaceId`. |
| `src/features/admin/hooks/use-admin-courts.ts` | Added `extGPlaceId` to curated court payload. |

### Backend DTOs + Service

| File | Change |
| --- | --- |
| `src/modules/court/dtos/admin-update-court.dto.ts` | Added `extGPlaceId` to update payload. |
| `src/modules/court/dtos/create-curated-court.dto.ts` | Added `extGPlaceId` to create payload. |
| `src/modules/court/services/admin-court.service.ts` | Persist `extGPlaceId` on create/update. |

### Backfill Script

| File | Change |
| --- | --- |
| `scripts/list-place-locations.ts` | Repurposed to backfill `extGPlaceId` with caching. |
| `package.json` | Added `db:backfill:ext-g-place-id` script alias. |

## Key Decisions

- `extGPlaceId` is **non-unique** to allow duplicates when internal places map to the same Google place.
- Resolver uses Upstash cache with **90-day TTL** for hits and **24-hour TTL** for misses to reduce API cost.
- When resolver fails, we leave `extGPlaceId` null and log (no risky fallback).

## Next Steps (if applicable)

- [ ] Run `pnpm db:migrate` to apply the new column.
- [ ] Run backfill in small batches: `pnpm db:backfill:ext-g-place-id -- --limit 50 --dry-run`.

## Commands to Continue

```bash
pnpm db:migrate
pnpm db:backfill:ext-g-place-id -- --limit 50 --dry-run
pnpm db:backfill:ext-g-place-id -- --limit 50
```
