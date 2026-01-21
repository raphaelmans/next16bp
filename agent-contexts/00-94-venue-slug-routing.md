# [00-94] Venue Slug Routing

> Date: 2026-01-21
> Previous: 00-93-contact-us.md

## Summary

Implemented slug-based venue routing with UUID fallback, canonicalized public URLs to `/venues`, and added slug customization/backfill support across backend, frontend, and owner/admin surfaces.

## Changes Made

### Database + Scripts

| File | Change |
| --- | --- |
| `src/shared/infra/db/schema/place.ts` | Added `slug` column and unique index. |
| `drizzle/0006_place_slug.sql` | Migration to add slug column + unique index. |
| `scripts/backfill-place-slugs.ts` | Backfill missing place slugs from names. |
| `package.json` | Added `db:backfill:place-slugs` script with dotenvx. |

### Backend

| File | Change |
| --- | --- |
| `src/lib/slug.ts` | Shared slug normalization/UUID detection helper. |
| `src/types/slug.d.ts` | Declared `slug` module types. |
| `src/modules/place/helpers.ts` | Resolve unique slugs with validation. |
| `src/modules/place/dtos/place.dto.ts` | Added slug fields + `getByIdOrSlug` schema. |
| `src/modules/place/repositories/place.repository.ts` | Added slug lookups and detail fetch by slug. |
| `src/modules/place/services/place-discovery.service.ts` | Added `getPlaceByIdOrSlug`. |
| `src/modules/place/place.router.ts` | Exposed `getByIdOrSlug` tRPC endpoint. |
| `src/modules/place/services/place-management.service.ts` | Generate/update slugs on create/update. |
| `src/modules/court/repositories/admin-court.repository.ts` | Added slug lookup for admin curated creation. |
| `src/modules/court/services/admin-court.service.ts` | Assign slug for curated places. |

### Frontend + Routing

| File | Change |
| --- | --- |
| `src/features/discovery/hooks/use-place-detail.ts` | Fetch by id or slug; return slug. |
| `src/features/discovery/hooks/use-discovery.ts` | Include slug in discovery summaries. |
| `src/shared/components/kudos/place-card.tsx` | Prefer slug in public links. |
| `src/features/owner/components/place-form.tsx` | Added slug field, preview, auto-suggest. |
| `src/features/owner/hooks/use-place-form.ts` | Send slug on create/update. |
| `src/app/(public)/places/[placeId]/page.tsx` | Resolve slug, use UUID for mutations, canonicalize. |
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Resolve slug, canonicalize, use `/venues` links. |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Resolve slug, canonicalize, UUID for booking. |
| `src/app/(public)/courts/[id]/page.tsx` | Metadata lookup by slug/id, canonical to `/venues`. |
| `src/app/(public)/courts/[id]/opengraph-image.tsx` | OG lookup by slug/id, canonical to `/venues`. |
| `src/app/(public)/venues/**` | Added `/venues` aliases for public pages. |
| `src/app/(auth)/venues/**` | Added `/venues` booking alias. |
| `src/app/(owner)/owner/venues/**` | Added owner `/venues` aliases. |

## Key Decisions

- Canonical public URLs use `/venues/<slug>` while still accepting UUID links.
- Slugs are customizable and normalized; UUID-like slugs are rejected.
- Mutations and telemetry use UUIDs from fetched records, not route params.

## Next Steps

- [ ] Run `pnpm db:migrate`.
- [ ] Run `pnpm db:backfill:place-slugs`.
- [ ] Validate with `pnpm lint` and `TZ=UTC pnpm build`.

## Commands to Continue

```bash
pnpm db:migrate
pnpm db:backfill:place-slugs
pnpm lint
TZ=UTC pnpm build
```
