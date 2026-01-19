# [00-61] Admin Photo Upload

> Date: 2026-01-18
> Previous: 00-60-admin-court-edit.md

## Summary

Switched the admin court edit photos section to file uploads with a dedicated admin upload endpoint, and wired storage-backed uploads for place photos.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/court/dtos/upload-photo.dto.ts` | Updated upload DTO to accept `placeId` and image file. |
| `src/modules/court/dtos/index.ts` | Re-exported upload DTOs. |
| `src/modules/court/admin/admin-court.router.ts` | Added `uploadPhoto` admin endpoint. |
| `src/modules/court/services/admin-court.service.ts` | Added storage-backed photo upload workflow for admin. |
| `src/modules/court/repositories/admin-court.repository.ts` | Added photo lookup/count helpers for uploads. |
| `src/modules/court/factories/court.factory.ts` | Injected storage service into admin court service. |

### Admin UI

| File | Change |
|------|--------|
| `src/app/(admin)/admin/courts/[id]/page.tsx` | Replaced photo URL inputs with file picker uploads and gallery preview. |
| `src/features/admin/hooks/use-admin-courts.ts` | Added upload hook for admin court photos. |
| `src/features/admin/hooks/index.ts` | Re-exported new upload hook. |

## Key Decisions

- Use a dedicated admin upload endpoint instead of URL inputs for consistent storage validation.
- Keep photo uploads out of the edit mutation to avoid mixing file and JSON payloads.

## Next Steps

- [ ] Add admin photo removal and reorder controls if needed.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
