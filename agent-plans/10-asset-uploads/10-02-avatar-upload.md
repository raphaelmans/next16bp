# Phase 2A: Profile Avatar Upload

**Dependencies:** Phase 1 complete (DONE)
**Parallelizable:** Yes (with 2B, 2C, 2D)
**User Story:** US-10-01 - Player Uploads Profile Avatar
**Developer:** Dev 1
**Status:** Ready to Implement

---

## Objective

Implement avatar upload functionality for player profiles:
- Add `uploadAvatar` endpoint to profile router (accepts FormData)
- Upload file to Supabase storage via `ObjectStorageService`
- Update profile with new avatar URL
- Return the URL to the client

---

## Current State

The profile module already exists with:
- `profile.router.ts` - Has `me`, `update`, `getById` endpoints
- `profile.service.ts` - Has `getProfile`, `updateProfile` methods
- `profile.repository.ts` - Has `update` method that accepts `avatarUrl`
- `update-profile.dto.ts` - Has `avatarUrl` field

**What's Missing:**
- Upload DTO for FormData
- `uploadAvatar` method in service
- `uploadAvatar` endpoint in router
- Storage service integration in factory
- Frontend hook and component connection

---

## Implementation Steps

### Step 1: Create Upload Avatar DTO

**File:** `src/modules/profile/dtos/upload-avatar.dto.ts` (NEW)

```typescript
import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";

/**
 * Schema for avatar upload FormData.
 * userId comes from session, not from client.
 */
export const UploadAvatarSchema = zfd.formData({
  image: imageFileSchema,
});

export type UploadAvatarInput = {
  image: File;
};
```

### Step 2: Update DTOs Index

**File:** `src/modules/profile/dtos/index.ts`

```typescript
export * from "./update-profile.dto";
export * from "./upload-avatar.dto";
```

### Step 3: Update Profile Service Interface

**File:** `src/modules/profile/services/profile.service.ts`

Add the `uploadAvatar` method to the interface and implementation:

```typescript
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { RequestContext } from "@/shared/kernel/context";
import type { IProfileRepository } from "../repositories/profile.repository";
import type { ProfileRecord } from "@/shared/infra/db/schema";
import type { UpdateProfileDTO } from "../dtos";
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";
import { ProfileNotFoundError } from "../errors/profile.errors";
import { logger } from "@/shared/infra/logger";

export interface IProfileService {
  getProfile(userId: string): Promise<ProfileRecord>;
  getOrCreateProfile(userId: string): Promise<ProfileRecord>;
  getProfileById(profileId: string): Promise<ProfileRecord>;
  updateProfile(userId: string, data: UpdateProfileDTO): Promise<ProfileRecord>;
  uploadAvatar(userId: string, file: File): Promise<string>; // NEW
}

export class ProfileService implements IProfileService {
  constructor(
    private profileRepository: IProfileRepository,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService, // NEW
  ) {}

  // ... existing methods unchanged ...

  /**
   * Upload avatar image and update profile.
   * Returns the public URL of the uploaded avatar.
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    // Get or create profile first
    const profile = await this.getOrCreateProfile(userId);

    // Generate path: {userId}/avatar.{ext}
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    // Upload file (upsert to replace existing)
    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.AVATARS,
      path,
      file,
      upsert: true,
    });

    // Update profile with new avatar URL
    await this.profileRepository.update(profile.id, {
      avatarUrl: result.url,
    });

    logger.info(
      {
        event: "profile.avatar_uploaded",
        profileId: profile.id,
        userId,
        url: result.url,
      },
      "Profile avatar uploaded"
    );

    return result.url;
  }
}
```

### Step 4: Update Profile Factory

**File:** `src/modules/profile/factories/profile.factory.ts`

```typescript
import { getContainer } from "@/shared/infra/container";
import { ProfileRepository } from "../repositories/profile.repository";
import { ProfileService } from "../services/profile.service";
import { makeObjectStorageService } from "@/modules/storage/factories/storage.factory";

let profileRepository: ProfileRepository | null = null;
let profileService: ProfileService | null = null;

export function makeProfileRepository(): ProfileRepository {
  if (!profileRepository) {
    profileRepository = new ProfileRepository(getContainer().db);
  }
  return profileRepository;
}

export function makeProfileService(): ProfileService {
  if (!profileService) {
    profileService = new ProfileService(
      makeProfileRepository(),
      getContainer().transactionManager,
      makeObjectStorageService(), // NEW - Add storage service
    );
  }
  return profileService;
}
```

### Step 5: Add Router Endpoint

**File:** `src/modules/profile/profile.router.ts`

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/shared/infra/trpc/trpc";
import { makeProfileService } from "./factories/profile.factory";
import { UpdateProfileSchema, UploadAvatarSchema } from "./dtos";
import { ProfileNotFoundError } from "./errors/profile.errors";

export const profileRouter = router({
  /**
   * Get current user's profile (auto-creates if missing)
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const profileService = makeProfileService();
    const profile = await profileService.getOrCreateProfile(ctx.userId);
    return profile;
  }),

  /**
   * Update current user's profile
   */
  update: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const profileService = makeProfileService();
      const profile = await profileService.updateProfile(ctx.userId, input);
      return profile;
    }),

  /**
   * Upload avatar image for current user
   * Accepts FormData with image file
   */
  uploadAvatar: protectedProcedure
    .input(UploadAvatarSchema)
    .mutation(async ({ input, ctx }) => {
      const profileService = makeProfileService();
      const url = await profileService.uploadAvatar(ctx.userId, input.image);
      return { url };
    }),

  /**
   * Get profile by ID (for viewing other players)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const profileService = makeProfileService();
      try {
        const profile = await profileService.getProfileById(input.id);
        return profile;
      } catch (error) {
        if (error instanceof ProfileNotFoundError) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),
});
```

---

## Frontend Implementation

### Step 6: Create Upload Hook

**File:** `src/features/profile/hooks/use-upload-avatar.ts` (NEW)

```typescript
"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to upload profile avatar.
 * Handles FormData creation, upload, and cache invalidation.
 */
export function useUploadAvatar() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      // tRPC v11 handles FormData natively via splitLink
      return trpc.profile.uploadAvatar.mutate(formData);
    },
    onSuccess: (data) => {
      // Invalidate profile query to refetch with new avatar
      queryClient.invalidateQueries({ queryKey: [["profile", "me"]] });
      toast.success("Avatar uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload avatar");
    },
  });
}
```

### Step 7: Connect to Profile Form

**File:** Update existing profile form component (location may vary)

```typescript
"use client";

import { useUploadAvatar } from "@/features/profile/hooks/use-upload-avatar";
import { AvatarUpload } from "@/shared/components/kudos/avatar-upload";

export function ProfileForm() {
  const { data: profile } = useProfile(); // Existing hook
  const updateProfile = useUpdateProfile(); // Existing hook
  const uploadAvatar = useUploadAvatar(); // NEW

  const handleAvatarSelect = async (file: File) => {
    await uploadAvatar.mutateAsync(file);
  };

  return (
    <form>
      <AvatarUpload
        currentAvatarUrl={profile?.avatarUrl}
        displayName={profile?.displayName}
        onFileSelect={handleAvatarSelect}
        isUploading={uploadAvatar.isPending}
      />
      {/* ... rest of form fields */}
    </form>
  );
}
```

---

## API Specification

### Endpoint

| Property | Value |
|----------|-------|
| Procedure | `profile.uploadAvatar` |
| Method | Mutation |
| Auth | Required (protectedProcedure) |
| Input | FormData with `image` field |
| Output | `{ url: string }` |

### Input Schema (FormData)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| image | File | Yes | Max 5MB, JPEG/PNG/WebP |

### Response

```typescript
{
  url: string; // Public URL to the uploaded avatar
}
```

### Error Responses

| Error | HTTP Code | Cause |
|-------|-----------|-------|
| `FILE_TOO_LARGE` | 400 | File exceeds 5MB |
| `INVALID_FILE_TYPE` | 400 | Not JPEG/PNG/WebP |
| `STORAGE_UPLOAD_FAILED` | 500 | Supabase upload error |
| `UNAUTHORIZED` | 401 | Not authenticated |

---

## Flow Diagram

```
┌────────────────┐
│  Profile Form  │
│ (AvatarUpload) │
└───────┬────────┘
        │ onFileSelect(file)
        ▼
┌────────────────┐
│ useUploadAvatar│
│    mutation    │
└───────┬────────┘
        │ FormData { image }
        ▼
┌────────────────┐
│   splitLink    │
│  (non-batched) │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ profile.       │
│ uploadAvatar   │
└───────┬────────┘
        │ input.image (File)
        ▼
┌────────────────┐
│ ProfileService │
│ .uploadAvatar  │
└───────┬────────┘
        │
        ├──────────────────────┐
        ▼                      ▼
┌────────────────┐    ┌────────────────────┐
│ ObjectStorage  │    │ ProfileRepository  │
│ Service.upload │    │ .update(avatarUrl) │
└───────┬────────┘    └────────────────────┘
        │
        ▼
┌────────────────┐
│   Supabase     │
│   Storage      │
│ (avatars bucket)│
└────────────────┘
```

---

## File Structure Changes

```
src/modules/profile/
├── dtos/
│   ├── index.ts              # Update: add export
│   ├── update-profile.dto.ts # Existing
│   └── upload-avatar.dto.ts  # NEW
├── services/
│   └── profile.service.ts    # Update: add uploadAvatar method
├── factories/
│   └── profile.factory.ts    # Update: add storage service
└── profile.router.ts         # Update: add uploadAvatar endpoint

src/features/profile/
└── hooks/
    └── use-upload-avatar.ts  # NEW
```

---

## Testing Checklist

### Backend Tests

- [ ] Upload JPEG avatar successfully
- [ ] Upload PNG avatar successfully
- [ ] Upload WebP avatar successfully
- [ ] Reject file > 5MB with `FILE_TOO_LARGE` error
- [ ] Reject PDF/DOC with `INVALID_FILE_TYPE` error
- [ ] Replace existing avatar (upsert works)
- [ ] Avatar URL saved to profile table
- [ ] Unauthenticated request returns 401
- [ ] Profile auto-created if doesn't exist

### Frontend Tests

- [ ] Loading state shown during upload
- [ ] New avatar displayed after success
- [ ] Error toast shown on failure
- [ ] Query cache invalidated after upload
- [ ] File input accepts only images

### E2E Tests

- [ ] Complete flow: select file -> upload -> see new avatar
- [ ] Error flow: select large file -> see error message

---

## Prerequisites

Before testing:

1. **Supabase bucket exists:** `avatars`
2. **Bucket is configured:** Private or public with appropriate RLS
3. **Environment variables set:**
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`

---

## Notes

- Avatar path format: `{userId}/avatar.{ext}` (single avatar per user)
- Uses `upsert: true` to replace existing avatar
- Profile auto-creates if it doesn't exist
- tRPC v11 handles FormData natively (no custom transformer)
