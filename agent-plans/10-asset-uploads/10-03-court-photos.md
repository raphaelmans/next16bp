# Phase 2B: Court Photos Upload

**Dependencies:** Phase 1 complete (DONE)
**Parallelizable:** Yes (with 2A, 2C, 2D)
**User Stories:** US-10-03, US-10-05
**Developer:** Dev 2
**Status:** Ready to Implement

---

## Objective

Implement court photo upload functionality:
- Add `uploadPhoto` endpoint to court management router (accepts FormData)
- Upload file to Supabase storage via `ObjectStorageService`
- Create photo record using existing `addPhoto` logic
- Support multiple photos per court with ordering

---

## Current State

The court module already has extensive photo management:

**Existing:**
- `court-photo.repository.ts` - Full CRUD for photo records
- `photo.dto.ts` - `AddPhotoSchema` (takes URL), `RemovePhotoSchema`, `ReorderPhotosSchema`
- `court-management.router.ts` - Has `addPhoto`, `removePhoto`, `reorderPhotos` endpoints
- `court-management.service.ts` - Has `addPhoto`, `removePhoto`, `reorderPhotos` methods
- `court.errors.ts` - Has `MaxPhotosExceededError`, `PhotoNotFoundError`

**What's Missing:**
- Upload DTO for FormData (currently `AddPhotoSchema` takes a URL)
- `uploadPhoto` endpoint that accepts FormData and uploads to storage
- Storage service integration
- Frontend hook for file upload

---

## Implementation Strategy

We'll add a new `uploadPhoto` endpoint that:
1. Accepts FormData with file
2. Uploads to Supabase storage
3. Calls existing `addPhoto` service method with the URL

This approach reuses all existing photo management logic.

---

## Implementation Steps

### Step 1: Create Upload Photo DTO

**File:** `src/modules/court/dtos/upload-photo.dto.ts` (NEW)

```typescript
import { z } from "zod";
import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";

/**
 * Schema for court photo upload FormData.
 */
export const UploadCourtPhotoSchema = zfd.formData({
  courtId: zfd.text(z.string().uuid()),
  image: imageFileSchema,
});

export type UploadCourtPhotoInput = {
  courtId: string;
  image: File;
};
```

### Step 2: Update DTOs Index

**File:** `src/modules/court/dtos/index.ts`

Add export:

```typescript
export * from "./upload-photo.dto";
```

### Step 3: Add Upload Method to Service

**File:** `src/modules/court/services/court-management.service.ts`

Add the `uploadPhoto` method to the interface and implementation:

```typescript
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";
import { v4 as uuidv4 } from "uuid";

export interface ICourtManagementService {
  // ... existing methods ...
  uploadPhoto(userId: string, courtId: string, file: File): Promise<CourtPhotoRecord>;
}

export class CourtManagementService implements ICourtManagementService {
  constructor(
    private courtRepository: ICourtRepository,
    private reservableCourtDetailRepository: IReservableCourtDetailRepository,
    private courtPhotoRepository: ICourtPhotoRepository,
    private courtAmenityRepository: ICourtAmenityRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService, // NEW
  ) {}

  // ... existing methods ...

  /**
   * Upload a photo to storage and add it to the court.
   */
  async uploadPhoto(
    userId: string,
    courtId: string,
    file: File
  ): Promise<CourtPhotoRecord> {
    // Verify ownership
    await this.verifyCourtOwnership(userId, courtId);

    // Check photo limit
    const photoCount = await this.courtPhotoRepository.countByCourtId(courtId);
    if (photoCount >= 10) {
      throw new MaxPhotosExceededError(courtId, 10);
    }

    // Generate unique path: {courtId}/{uuid}.{ext}
    const photoId = uuidv4();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${courtId}/${photoId}.${ext}`;

    // Upload to storage
    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.COURT_PHOTOS,
      path,
      file,
      upsert: false, // Multiple photos allowed
    });

    // Add photo record using existing logic
    const photo = await this.addPhoto(userId, {
      courtId,
      url: result.url,
    });

    logger.info(
      {
        event: "court.photo_uploaded",
        courtId,
        photoId: photo.id,
        url: result.url,
      },
      "Court photo uploaded"
    );

    return photo;
  }
}
```

### Step 4: Update Court Factory

**File:** `src/modules/court/factories/court.factory.ts`

Update `makeCourtManagementService` to include storage service:

```typescript
import { makeObjectStorageService } from "@/modules/storage/factories/storage.factory";

export function makeCourtManagementService() {
  if (!courtManagementService) {
    courtManagementService = new CourtManagementService(
      makeCourtRepository(),
      makeReservableCourtDetailRepository(),
      makeCourtPhotoRepository(),
      makeCourtAmenityRepository(),
      makeOrganizationRepository(),
      getContainer().transactionManager,
      makeObjectStorageService(), // NEW
    );
  }
  return courtManagementService;
}
```

### Step 5: Add Upload Endpoint to Router

**File:** `src/modules/court/court-management.router.ts`

Add the `uploadPhoto` endpoint:

```typescript
import { UploadCourtPhotoSchema } from "./dtos";

export const courtManagementRouter = router({
  // ... existing endpoints ...

  /**
   * Upload a photo to a court
   * Accepts FormData with image file
   */
  uploadPhoto: protectedRateLimitedProcedure("mutation")
    .input(UploadCourtPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.uploadPhoto(ctx.userId, input.courtId, input.image);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  // Keep existing addPhoto for URL-based additions (e.g., from URL input)
  addPhoto: protectedRateLimitedProcedure("mutation")
    .input(AddPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.addPhoto(ctx.userId, input);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  // ... rest of existing endpoints ...
});
```

---

## Frontend Implementation

### Step 6: Create Upload Hook

**File:** `src/features/owner/hooks/use-court-photos.ts` (NEW)

```typescript
"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to fetch court photos.
 */
export function useCourtPhotos(courtId: string) {
  const trpc = useTRPC();

  return useQuery({
    queryKey: [["courtManagement", "getById"], { courtId }],
    queryFn: () => trpc.courtManagement.getById.query({ courtId }),
    select: (data) => data?.photos ?? [],
  });
}

/**
 * Hook to upload a photo to a court.
 */
export function useUploadCourtPhoto(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("courtId", courtId);
      formData.append("image", file);

      return trpc.courtManagement.uploadPhoto.mutate(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["courtManagement", "getById"], { courtId }],
      });
      queryClient.invalidateQueries({
        queryKey: [["courtManagement", "getMyCourts"]],
      });
      toast.success("Photo uploaded");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload photo");
    },
  });
}

/**
 * Hook to delete a photo from a court.
 */
export function useDeleteCourtPhoto(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) =>
      trpc.courtManagement.removePhoto.mutate({ courtId, photoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["courtManagement", "getById"], { courtId }],
      });
      toast.success("Photo deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete photo");
    },
  });
}

/**
 * Hook to reorder photos.
 */
export function useReorderCourtPhotos(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoIds: string[]) =>
      trpc.courtManagement.reorderPhotos.mutate({ courtId, photoIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["courtManagement", "getById"], { courtId }],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder photos");
    },
  });
}
```

### Step 7: Create Photo Uploader Component

**File:** `src/features/owner/components/court-photo-uploader.tsx` (NEW)

```typescript
"use client";

import { useDropzone } from "react-dropzone";
import { X, Upload, GripVertical, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useCourtPhotos,
  useUploadCourtPhoto,
  useDeleteCourtPhoto,
} from "../hooks/use-court-photos";

interface CourtPhotoUploaderProps {
  courtId: string;
}

export function CourtPhotoUploader({ courtId }: CourtPhotoUploaderProps) {
  const { data: photos, isLoading } = useCourtPhotos(courtId);
  const uploadPhoto = useUploadCourtPhoto(courtId);
  const deletePhoto = useDeleteCourtPhoto(courtId);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 5 * 1024 * 1024,
    onDrop: async (files) => {
      for (const file of files) {
        await uploadPhoto.mutateAsync(file);
      }
    },
  });

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          uploadPhoto.isPending && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        {uploadPhoto.isPending ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm">
          {isDragActive
            ? "Drop photos here"
            : uploadPhoto.isPending
              ? "Uploading..."
              : "Drag photos or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP up to 5MB (max 10 photos)
        </p>
      </div>

      {/* Photo grid */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos?.map((photo) => (
            <div key={photo.id} className="relative group aspect-video">
              <Image
                src={photo.url}
                alt="Court photo"
                fill
                className="rounded-lg object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deletePhoto.mutate(photo.id)}
                disabled={deletePhoto.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
              {photo.displayOrder === 0 && (
                <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {photos && photos.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No photos yet. Upload some photos to showcase your court.
        </p>
      )}
    </div>
  );
}
```

---

## API Specification

### Upload Photo Endpoint

| Property | Value |
|----------|-------|
| Procedure | `courtManagement.uploadPhoto` |
| Method | Mutation |
| Auth | Required (protectedProcedure) |
| Rate Limited | Yes |
| Input | FormData with `courtId` and `image` fields |
| Output | `CourtPhotoRecord` |

### Input Schema (FormData)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| courtId | string | Yes | UUID |
| image | File | Yes | Max 5MB, JPEG/PNG/WebP |

### Response

```typescript
{
  id: string;
  courtId: string;
  url: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Error Responses

| Error | HTTP Code | Cause |
|-------|-----------|-------|
| `FILE_TOO_LARGE` | 400 | File exceeds 5MB |
| `INVALID_FILE_TYPE` | 400 | Not JPEG/PNG/WebP |
| `MAX_PHOTOS_EXCEEDED` | 400 | Court already has 10 photos |
| `COURT_NOT_FOUND` | 404 | Court doesn't exist |
| `NOT_COURT_OWNER` | 403 | User doesn't own the court |
| `UNAUTHORIZED` | 401 | Not authenticated |

---

## Flow Diagram

```
┌────────────────────┐
│ CourtPhotoUploader │
│   (drag & drop)    │
└─────────┬──────────┘
          │ onDrop(files)
          ▼
┌────────────────────┐
│ useUploadCourtPhoto│
│     mutation       │
└─────────┬──────────┘
          │ FormData { courtId, image }
          ▼
┌────────────────────┐
│     splitLink      │
│   (non-batched)    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ courtManagement.   │
│    uploadPhoto     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────────┐
│ CourtManagementService │
│     .uploadPhoto       │
└─────────┬──────────────┘
          │
          ├────────────────────────┐
          ▼                        ▼
┌─────────────────────┐   ┌────────────────────┐
│  ObjectStorage      │   │  CourtPhoto        │
│  Service.upload     │   │  Repository.create │
└─────────┬───────────┘   └────────────────────┘
          │
          ▼
┌─────────────────────┐
│    Supabase         │
│    Storage          │
│ (court-photos bucket)│
└─────────────────────┘
```

---

## File Structure Changes

```
src/modules/court/
├── dtos/
│   ├── index.ts               # Update: add export
│   ├── photo.dto.ts           # Existing (URL-based)
│   └── upload-photo.dto.ts    # NEW (FormData)
├── services/
│   └── court-management.service.ts  # Update: add uploadPhoto
└── factories/
    └── court.factory.ts       # Update: add storage service

src/features/owner/
├── hooks/
│   └── use-court-photos.ts    # NEW
└── components/
    └── court-photo-uploader.tsx # NEW
```

---

## Authorization

Photo upload follows existing court ownership verification:

1. **Owner:** Can upload to courts belonging to their organizations
2. **Admin:** Can upload to any court (via admin router if needed)

The existing `verifyCourtOwnership` method in the service handles this check.

---

## Testing Checklist

### Backend Tests

- [ ] Upload single photo successfully
- [ ] Upload multiple photos sequentially
- [ ] Reject file > 5MB
- [ ] Reject non-image file
- [ ] Reject when court has 10 photos (MAX_PHOTOS_EXCEEDED)
- [ ] Reject for non-owner (FORBIDDEN)
- [ ] Reject for non-existent court (NOT_FOUND)
- [ ] Photo record created with correct displayOrder
- [ ] File stored in correct bucket path

### Frontend Tests

- [ ] Drag and drop upload works
- [ ] Click to upload works
- [ ] Loading state during upload
- [ ] Photos grid displays after upload
- [ ] Delete photo works
- [ ] Primary photo badge shown
- [ ] Error toast on failure
- [ ] Query cache invalidated

### E2E Tests

- [ ] Complete flow: drop file -> upload -> see in grid
- [ ] Error flow: drop large file -> see error
- [ ] Delete flow: click X -> confirm -> photo removed

---

## Prerequisites

Before testing:

1. **Supabase bucket exists:** `court-photos`
2. **Bucket is configured:** Private or public with appropriate RLS
3. **Environment variables set:**
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`

---

## Notes

- Photo path format: `{courtId}/{uuid}.{ext}` (unique per photo)
- Maximum 10 photos per court (existing business rule)
- Uses existing `addPhoto` logic for record creation
- Existing `removePhoto` endpoint should delete from storage (enhancement)
- Consider adding storage deletion to `removePhoto` service method
