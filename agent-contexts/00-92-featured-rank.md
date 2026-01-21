# [00-92] Featured Rank Support

> Date: 2026-01-21
> Previous: 00-91-mobile-filters-sheet.md

## Summary

Implemented numeric featured ranking for venues, with discovery sorting precedence, featured-only queries for landing, admin rank editing with conflict validation, and public UI badges.

## Changes Made

### Data Model

| File | Change |
|------|--------|
| `drizzle/0006_place_featured_rank.sql` | Added `featured_rank` column, non-negative check, and unique partial index. |
| `src/shared/infra/db/schema/place.ts` | Added `featuredRank` field and partial unique index in Drizzle schema. |

### Discovery + Public UI

| File | Change |
|------|--------|
| `src/modules/place/dtos/place.dto.ts` | Added `featuredOnly` filter to list schema. |
| `src/modules/place/services/place-discovery.service.ts` | Passed `featuredOnly` to repository. |
| `src/modules/place/repositories/place.repository.ts` | Added featured ordering precedence and filter. |
| `src/features/discovery/hooks/use-discovery.ts` | Mapped featured rank, featured-only landing query. |
| `src/shared/components/kudos/place-card.tsx` | Displayed Featured badge with rank. |

### Admin UX + Validation

| File | Change |
|------|--------|
| `src/modules/court/dtos/admin-update-court.dto.ts` | Added `featuredRank` to admin update schema. |
| `src/modules/court/errors/court.errors.ts` | Added `PlaceFeaturedRankTakenError` conflict error. |
| `src/modules/court/repositories/admin-court.repository.ts` | Added `findByFeaturedRank` query. |
| `src/modules/court/services/admin-court.service.ts` | Added featured rank validation and persistence. |
| `src/features/admin/hooks/use-admin-courts.ts` | Included featured rank in admin list mapping. |
| `src/app/(admin)/admin/courts/page.tsx` | Added Featured column in admin list. |
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Added featured rank edit form and save handler. |

## Key Decisions

- Use numeric `featured_rank` to allow ordering, with `0` meaning non-featured.
- Enforce unique featured ranks via a partial unique index and service-level conflict error.

## Next Steps

- [ ] Run `pnpm db:migrate` to apply the new column and index.
- [ ] Validate with `pnpm lint` and `TZ=UTC pnpm build`.

## Commands to Continue

```bash
pnpm db:migrate
pnpm lint
TZ=UTC pnpm build
```
