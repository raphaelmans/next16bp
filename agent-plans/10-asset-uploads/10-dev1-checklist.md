# Developer 1 Checklist - Infrastructure + Avatar

**Focus Area:** Infrastructure setup + Profile avatar upload
**Modules:** 1A, 1B, 2A
**Status:** Phase 1 COMPLETE, Phase 2A Ready

---

## Phase 1: Infrastructure - COMPLETE

**Reference:** `10-01-infrastructure.md`

### 1A: Package & tRPC Configuration - DONE

- [x] Install `zod-form-data` package
- [x] Verify Zod v4 compatibility
- [x] Update `src/components/providers.tsx`
  - [x] Import `splitLink`, `httpLink`, `isNonJsonSerializable`
  - [x] Configure `splitLink` for FormData routing
  - [x] FormData routes to non-batched `httpLink`
  - [x] JSON routes to batched `httpBatchLink`
- [x] TypeScript compiles without errors
- [x] App loads correctly with new provider config

**Note:** tRPC v11 handles FormData natively - no custom transformer needed.

### 1B: Storage Module - DONE

- [x] Directory structure created:
  ```
  src/modules/storage/
  ├── storage.router.ts
  ├── errors/
  │   └── storage.errors.ts
  ├── services/
  │   └── object-storage.service.ts
  ├── factories/
  │   └── storage.factory.ts
  └── dtos/
      ├── index.ts
      └── upload.dto.ts
  ```
- [x] `storage.errors.ts` - All error classes
- [x] `upload.dto.ts` - Schemas and constants
- [x] `object-storage.service.ts` - Full implementation
- [x] `storage.factory.ts` - Singleton pattern

### Handoff - DONE

- [x] Phase 1 complete - Dev 2 and Dev 3 can start
- [x] Supabase buckets need to be created (see Prerequisites below)

---

## Phase 2A: Avatar Upload - READY TO IMPLEMENT

**Reference:** `10-02-avatar-upload.md`
**User Story:** US-10-01

### Prerequisites

Before starting:
- [ ] Create `avatars` bucket in Supabase Dashboard
- [ ] Configure bucket RLS (see `10-01-infrastructure.md`)

### Backend

- [ ] Create `src/modules/profile/dtos/upload-avatar.dto.ts`
  - [ ] `UploadAvatarSchema` with zfd
  - [ ] Export from `dtos/index.ts`

- [ ] Update `src/modules/profile/services/profile.service.ts`
  - [ ] Add `IObjectStorageService` to constructor
  - [ ] Add `uploadAvatar(userId, file)` method
  - [ ] Generate path: `{userId}/avatar.{ext}`
  - [ ] Upload with `upsert: true`
  - [ ] Update profile with avatar URL
  - [ ] Return URL

- [ ] Update `src/modules/profile/factories/profile.factory.ts`
  - [ ] Import `makeObjectStorageService`
  - [ ] Add storage service to `ProfileService` constructor

- [ ] Update `src/modules/profile/profile.router.ts`
  - [ ] Import `UploadAvatarSchema`
  - [ ] Add `uploadAvatar` procedure
  - [ ] Use `protectedProcedure`
  - [ ] Return `{ url: string }`

### Frontend

- [ ] Create `src/features/profile/hooks/use-upload-avatar.ts`
  - [ ] `useUploadAvatar()` mutation hook
  - [ ] Create FormData with `image` field
  - [ ] Call `trpc.profile.uploadAvatar.mutate(formData)`
  - [ ] Invalidate `profile.me` query on success
  - [ ] Toast notifications

- [ ] Connect to profile form
  - [ ] Import `useUploadAvatar`
  - [ ] Handle file selection
  - [ ] Pass `isPending` for loading state
  - [ ] Display new avatar after success

### Testing

- [ ] Upload JPEG avatar successfully
- [ ] Upload PNG avatar successfully
- [ ] Upload WebP avatar successfully
- [ ] Reject file > 5MB with error toast
- [ ] Reject non-image file with error toast
- [ ] Replace existing avatar (upsert)
- [ ] Avatar URL saved to profile table
- [ ] Loading state shown during upload
- [ ] New avatar displayed after success
- [ ] Profile query cache invalidated

---

## Final Verification

- [ ] `bun run typecheck` passes
- [ ] `bun run build` succeeds
- [ ] Manual E2E: Avatar upload flow works end-to-end
- [ ] Update `10-00-overview.md` to mark Phase 2A complete
