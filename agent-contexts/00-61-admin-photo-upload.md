# [00-61] Admin Photo Upload

> Date: 2026-01-18
> Previous: 00-60-admin-court-edit.md

## Summary

Switched the admin court edit page from URL-based photo inputs to a file upload flow and added a dedicated admin upload endpoint for place photos.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/court/dtos/upload-photo.dto.ts` | Updated upload schema to accept `placeId` for admin uploads. |
| `src/modules/court/dtos/index.ts` | Exported upload photo DTO. |
| `src/modules/court/admin/admin-court.router.ts` | Added `uploadPhoto` admin mutation. |
| `src/modules/court/services/admin-court.service.ts` | Implemented storage upload flow and photo creation. |
| `src/modules/court/repositories/admin-court.repository.ts` | Added photo lookup/count helpers. |
| `src/modules/court/factories/court.factory.ts` | Wired storage service into admin court service. |

### Admin UI

| File | Change |
|------|--------|
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Replaced URL inputs with file picker upload and preview grid. |
| `src/features/admin/hooks/use-admin-courts.ts` | Added `useUploadAdminCourtPhoto` hook for admin uploads. |
| `src/features/admin/hooks/index.ts` | Re-exported admin upload hook. |

## Key Decisions

- Use a dedicated admin upload mutation for court photos instead of URL entry, matching existing FormData upload patterns.
- Keep photo deletion/reordering out of scope for now; focus on upload and display in the admin edit page.

## Next Steps

- [ ] Add admin photo remove/reorder actions if needed.

## Commands to Continue

```bash
pnpm lint
```
