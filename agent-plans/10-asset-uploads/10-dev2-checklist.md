# Developer 2 Checklist - Court Photos + Org Logo + Place Photos

**Focus Area:** Owner upload features
**Modules:** 2B, 2D, 2E
**Status:** Phase 1 COMPLETE - Ready to start Phase 2

---

## Prerequisites

- [x] Phase 1 is complete (storage module implemented)
- [ ] Create buckets in Supabase Dashboard:
  - [ ] `court-photos`
  - [ ] `organization-assets`
  - [ ] `place-photos`
- [ ] Configure bucket RLS (see `10-01-infrastructure.md`)

---

## Phase 2B: Court Photos Upload

**Reference:** `10-03-court-photos.md`
**User Stories:** US-10-03, US-10-05

### Existing Code to Leverage

The court module already has photo management:
- `court-photo.repository.ts` - Full CRUD
- `photo.dto.ts` - `AddPhotoSchema` (URL-based)
- `court-management.router.ts` - `addPhoto`, `removePhoto`, `reorderPhotos`
- `court-management.service.ts` - Photo business logic

You're adding FormData upload that uses the existing infrastructure.

### Backend

- [ ] Create `src/modules/court/dtos/upload-photo.dto.ts`
  - [ ] `UploadCourtPhotoSchema` with zfd
  - [ ] Fields: `courtId` (UUID), `image` (File)
  - [ ] Export from `dtos/index.ts`

- [ ] Update `src/modules/court/services/court-management.service.ts`
  - [ ] Add `IObjectStorageService` to constructor
  - [ ] Add `uploadPhoto(userId, courtId, file)` method
  - [ ] Verify ownership via existing `verifyCourtOwnership`
  - [ ] Check photo limit (max 10)
  - [ ] Upload to `court-photos` bucket
  - [ ] Call existing `addPhoto` logic with URL
  - [ ] Return photo record

- [ ] Update `src/modules/court/factories/court.factory.ts`
  - [ ] Import `makeObjectStorageService`
  - [ ] Add to `makeCourtManagementService` constructor

- [ ] Update `src/modules/court/court-management.router.ts`
  - [ ] Import `UploadCourtPhotoSchema`
  - [ ] Add `uploadPhoto` procedure
  - [ ] Keep existing `addPhoto`, `removePhoto`, `reorderPhotos`

### Frontend

- [ ] Create `src/features/owner/hooks/use-court-photos.ts`
  - [ ] `useCourtPhotos(courtId)` - fetch photos
  - [ ] `useUploadCourtPhoto(courtId)` - upload mutation
  - [ ] `useDeleteCourtPhoto(courtId)` - delete mutation
  - [ ] `useReorderCourtPhotos(courtId)` - reorder mutation

- [ ] Create `src/features/owner/components/court-photo-uploader.tsx`
  - [ ] Dropzone with `react-dropzone`
  - [ ] Photo grid display
  - [ ] Delete button per photo
  - [ ] Primary photo badge (displayOrder === 0)
  - [ ] Loading states

### Testing

- [ ] Upload single photo successfully
- [ ] Upload multiple photos sequentially
- [ ] Delete photo
- [ ] Reject file > 5MB
- [ ] Reject non-image file
- [ ] Reject when court has 10 photos
- [ ] Owner can upload to own courts
- [ ] Non-owner gets 403
- [ ] Photo displayOrder correct

---

## Phase 2E: Place Photos Upload

**Reference:** `10-06-place-photos.md`
**User Story:** US-10-06

### Backend

- [ ] Add `PLACE_PHOTOS` bucket constant
- [ ] Add place photo DTOs (upload/remove/reorder)
- [ ] Add `uploadPhoto/removePhoto/reorderPhotos` to place management router
- [ ] Implement storage upload + DB record creation in place management service
- [ ] Implement delete (DB + storage object)

### Frontend

- [ ] Add a photo uploader section to place edit page
- [ ] Support delete + set-as-cover (reorder)

### Testing

- [ ] Upload, delete, reorder happy paths
- [ ] Reject non-image and >5MB
- [ ] Non-owner cannot mutate

---

## Phase 2D: Organization Logo Upload

**Reference:** `10-05-org-logo.md`
**User Story:** US-10-04

### Existing Code to Leverage

The organization module already has:
- `organization.service.ts` - `updateOrganizationProfile` with ownership check
- Ownership via `org.ownerUserId !== userId`

You're adding logo upload that updates the profile.

### Backend

- [ ] Create `src/modules/organization/dtos/upload-logo.dto.ts`
  - [ ] `UploadOrganizationLogoSchema` with zfd
  - [ ] Fields: `organizationId` (UUID), `image` (File)
  - [ ] Export from `dtos/index.ts`

- [ ] Update `src/modules/organization/services/organization.service.ts`
  - [ ] Add `IObjectStorageService` to constructor
  - [ ] Add `uploadLogo(userId, organizationId, file)` method
  - [ ] Verify ownership
  - [ ] Upload to `organization-assets` bucket
  - [ ] Path: `{organizationId}/logo.{ext}` with upsert
  - [ ] Update/create organization profile with logoUrl
  - [ ] Return URL

- [ ] Update `src/modules/organization/factories/organization.factory.ts`
  - [ ] Import `makeObjectStorageService`
  - [ ] Add to `makeOrganizationService` constructor

- [ ] Update `src/modules/organization/organization.router.ts`
  - [ ] Import `UploadOrganizationLogoSchema`
  - [ ] Add `uploadLogo` procedure
  - [ ] Return `{ url: string }`

### Frontend

- [ ] Create `src/features/owner/hooks/use-organization-logo.ts`
  - [ ] `useUploadOrganizationLogo(organizationId)` mutation

- [ ] Create `src/features/owner/components/organization-logo-upload.tsx`
  - [ ] Logo preview (or fallback icon)
  - [ ] Upload button
  - [ ] Loading overlay during upload
  - [ ] "Change Logo" when logo exists

### Testing

- [ ] Upload logo successfully
- [ ] Replace existing logo (upsert)
- [ ] Reject file > 5MB
- [ ] Reject non-image file
- [ ] Non-owner gets 403
- [ ] Logo URL saved to organization_profile
- [ ] Profile auto-created if doesn't exist
- [ ] Loading state shown
- [ ] New logo displayed after success

---

## Integration Points

### Court Photos

- [ ] Add `CourtPhotoUploader` to court edit page
- [ ] Photos display on court detail (public view)
- [ ] Photos display in owner dashboard

### Org Logo

- [ ] Add `OrganizationLogoUpload` to organization settings
- [ ] Logo displays in organization header
- [ ] Logo displays on court cards

---

## Final Verification

- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] Manual E2E: Court photo upload flow
- [ ] Manual E2E: Org logo upload flow
- [ ] Update `10-00-overview.md` to mark Phase 2B and 2D complete
