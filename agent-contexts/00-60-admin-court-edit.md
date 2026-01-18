# [00-60] Admin Court Edit

> Date: 2026-01-18
> Previous: 00-59-public-schedule-view.md

## Summary

Implemented the admin court edit route and detail API so `/admin/courts/[id]` no longer 404s, and extended admin updates to support full curated court edits with photo URL arrays, amenities, and court units.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/court/dtos/admin-update-court.dto.ts` | Added admin detail schema and expanded update DTO to cover contact, amenities, photos, courts, and time zone inputs. |
| `src/modules/court/admin/admin-court.router.ts` | Added `getById` admin query for place details. |
| `src/modules/court/repositories/admin-court.repository.ts` | Added admin detail fetch and court CRUD helpers to support edits. |
| `src/modules/court/services/admin-court.service.ts` | Added detail fetch and normalized update flows for photos and courts. |

### Admin UI

| File | Change |
|------|--------|
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Added admin edit page with full form (contacts, amenities, courts, photo URLs). |
| `src/app/(admin)/admin/courts/new/page.tsx` | Added time zone select and photo URL array handling for create flow. |
| `src/features/admin/schemas/admin-court-edit.schema.ts` | Added form schema for admin edit page. |
| `src/features/admin/schemas/curated-court.schema.ts` | Added time zone and photos to curated form schema. |
| `src/features/admin/hooks/use-admin-courts.ts` | Added admin detail hook data shape and cache invalidation for detail queries. |
| `src/features/admin/hooks/index.ts` | Re-exported admin court detail type. |

## Key Decisions

- Preserve existing court IDs during edit updates while adding/removing as needed to avoid breaking downstream references.
- Store photo URLs as a field array with normalization to filter empty entries.

## Next Steps

- [ ] Run `pnpm build` if you want a full validation pass.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
