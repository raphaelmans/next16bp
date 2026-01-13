# [00-36] Place Photo Uploads

> Date: 2026-01-13
> Previous: 00-35-trpc-formdata-uploads.md

## Summary

Added place photo upload, delete, and reorder support with Supabase Storage-backed uploads and owner UI controls on the place edit page. Introduced a new `place-photos` bucket and updated planning artifacts for the place photo user story and implementation phase.

## Changes Made

### Backend

| File | Change |
|------|--------|
| `src/modules/place/repositories/place-photo.repository.ts` | Added repository for place photo CRUD and ordering. |
| `src/modules/place/services/place-management.service.ts` | Implemented place photo upload/delete/reorder with ownership checks and storage cleanup. |
| `src/modules/place/place-management.router.ts` | Added `uploadPhoto`, `removePhoto`, and `reorderPhotos` procedures. |
| `src/modules/place/factories/place.factory.ts` | Wired photo repository and storage service into place management service. |
| `src/modules/place/dtos/upload-place-photo.dto.ts` | Added FormData upload schema for place photos. |
| `src/modules/place/dtos/remove-place-photo.dto.ts` | Added remove DTO for place photos. |
| `src/modules/place/dtos/reorder-place-photos.dto.ts` | Added reorder DTO for place photos. |
| `src/modules/place/errors/place-photo.errors.ts` | Added max-count, not-found, and order validation errors. |
| `src/modules/place/dtos/index.ts` | Exported place photo DTOs. |
| `src/modules/place/errors/place.errors.ts` | Re-exported place photo errors. |

### Frontend

| File | Change |
|------|--------|
| `src/features/owner/hooks/use-place-photos.ts` | Added upload/remove/reorder hooks with cache invalidation. |
| `src/features/owner/hooks/index.ts` | Exported place photo hooks. |
| `src/features/owner/components/place-photo-upload.tsx` | Added owner photo uploader with cover + reorder controls. |
| `src/features/owner/components/index.ts` | Exported `PlacePhotoUpload`. |
| `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` | Embedded place photo upload section on the edit page. |

### Storage

| File | Change |
|------|--------|
| `src/modules/storage/dtos/upload.dto.ts` | Added `PLACE_PHOTOS` bucket and readable file size label. |
| `scripts/seed-storage-buckets.ts` | Added `place-photos` bucket seed entry. |

### Planning Docs

| File | Change |
|------|--------|
| `agent-plans/user-stories/10-asset-uploads/10-00-overview.md` | Added US-10-06 and `place-photos` bucket references. |
| `agent-plans/user-stories/10-asset-uploads/10-06-owner-uploads-place-photos.md` | New user story for owner place photo uploads. |
| `agent-plans/10-asset-uploads/10-00-overview.md` | Added Phase 2E and plan references. |
| `agent-plans/10-asset-uploads/10-06-place-photos.md` | New implementation plan for place photos. |
| `agent-plans/10-asset-uploads/10-dev2-checklist.md` | Added place photo checklist items. |

## Key Decisions

- Use top-level `FormData` for `placeManagement.uploadPhoto` to match the established tRPC FormData upload pattern.
- Store place photos in a new `place-photos` bucket with public access for discovery pages.
- Remove storage objects when deleting place photos to avoid orphaned files.
- Keep the max photo count consistent with court photo UX (10).

## Next Steps (if applicable)

- [ ] Confirm Supabase RLS policies for `place-photos` bucket.
- [ ] Optional: add drag-and-drop ordering if needed.

## Commands to Continue

```bash
pnpm db:seed:buckets
pnpm lint
pnpm build
```
