# Phase 2E: Place Photos Upload

**Dependencies:** Phase 1 complete (DONE)
**Parallelizable:** Yes (with 2A, 2B, 2C, 2D)
**User Stories:** US-10-06
**Developer:** Dev 2

---

## Objective

Implement place photo upload + management:
- Add `uploadPlacePhoto` endpoint in place management router (accepts FormData)
- Upload file to Supabase storage via `ObjectStorageService`
- Create photo record in `place_photo` with ordering
- Support delete (DB + storage object)
- Support reorder and "set as cover" (first photo)

---

## Storage

### Bucket

- Bucket: `place-photos`
- Access: Public (temporary, MVP)

### Path Convention

- `{placeId}/{photoId}.{ext}`

---

## Backend

### DTOs

**New files (suggested):**
- `src/modules/place/dtos/upload-place-photo.dto.ts` (FormData)
- `src/modules/place/dtos/remove-place-photo.dto.ts`
- `src/modules/place/dtos/reorder-place-photos.dto.ts`

**Schemas:**
- Upload: `{ placeId: uuid, image: imageFileSchema }`
- Remove: `{ placeId: uuid, photoId: uuid }`
- Reorder: `{ placeId: uuid, orderedIds: uuid[] }`

### Router

**File:** `src/modules/place/place-management.router.ts`

Add procedures:
- `uploadPhoto` (mutation, FormData input)
- `removePhoto` (mutation)
- `reorderPhotos` (mutation)

### Service

**File:** `src/modules/place/services/place-management.service.ts`

Add methods:
- `uploadPhoto(userId, placeId, file)`
- `removePhoto(userId, placeId, photoId)`
- `reorderPhotos(userId, placeId, orderedIds)`

Implementation notes:
- Ownership check: reuse existing `assertOwner(userId, place.organizationId)`
- Upload:
  - Generate `photoId = uuidv4()`
  - `path = `${placeId}/${photoId}.${ext}``
  - Upload via `storageService.upload({ bucket: STORAGE_BUCKETS.PLACE_PHOTOS, path, file, upsert: false })`
  - Compute `displayOrder` as max+1 (or append after current count)
  - Insert `place_photo` record with `url` and `displayOrder`
- Delete:
  - Verify photo belongs to place
  - Delete DB record
  - Delete storage object (derive `path` from URL or store `path` explicitly)
- Reorder:
  - Validate orderedIds set matches existing photos for place
  - Update `displayOrder` sequentially (0..n-1)

### Storage DTO Updates

- Add `PLACE_PHOTOS: "place-photos"` to `src/modules/storage/dtos/upload.dto.ts`.
- Update `scripts/seed-storage-buckets.ts` to create the new bucket (public for now).

---

## Frontend

### Owner UI

**Page:** `src/app/(owner)/owner/places/[placeId]/edit/page.tsx`

Add a "Photos" section:
- Existing photo grid
- Upload button (file input)
- Delete action per photo
- "Set as cover" action (reorder)

### Data Wiring

- Invalidate `trpc.placeManagement.getById` after changes (owner page)
- Invalidate `trpc.place.getById` to refresh public place data

---

## Public Display

Public place detail page already renders `place.photos` using `PhotoGallery`:
- `src/app/(public)/places/[placeId]/page.tsx`

So the main requirement is to ensure `place_photo` rows are created/ordered correctly.

---

## Testing Checklist

- [ ] Upload valid image under 5MB
- [ ] Reject non-image file
- [ ] Reject > 5MB
- [ ] Delete photo removes from page + storage
- [ ] Reorder updates cover
- [ ] Non-owner cannot upload/delete/reorder
- [ ] `pnpm lint` and `pnpm build` pass
