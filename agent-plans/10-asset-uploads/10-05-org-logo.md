# Phase 2D: Organization Logo Upload

**Dependencies:** Phase 1 complete (DONE)
**Parallelizable:** Yes (with 2A, 2B, 2C)
**User Story:** US-10-04 - Owner Uploads Organization Logo
**Developer:** Dev 2
**Status:** Ready to Implement

---

## Objective

Implement organization logo upload functionality:
- Add `uploadLogo` endpoint to organization router (accepts FormData)
- Upload file to Supabase storage via `ObjectStorageService`
- Update organization profile with logo URL
- Single logo per organization (upsert pattern)

---

## Current State

The organization module already exists with:

**Existing:**
- `organization.router.ts` - Has `update`, `updateProfile` endpoints
- `organization.service.ts` - Has `updateOrganizationProfile` with ownership check via `ownerUserId`
- `organization-profile.repository.ts` - Can update profile fields including `logoUrl`
- Ownership verification via `org.ownerUserId !== userId`

**What's Missing:**
- Upload DTO for FormData
- `uploadLogo` method in service
- Storage service integration in factory
- Frontend hook and component

---

## Implementation Steps

### Step 1: Create Upload Logo DTO

**File:** `src/modules/organization/dtos/upload-logo.dto.ts` (NEW)

```typescript
import { z } from "zod";
import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";

/**
 * Schema for organization logo upload FormData.
 */
export const UploadOrganizationLogoSchema = zfd.formData({
  organizationId: zfd.text(z.string().uuid()),
  image: imageFileSchema,
});

export type UploadOrganizationLogoInput = {
  organizationId: string;
  image: File;
};
```

### Step 2: Update DTOs Index

**File:** `src/modules/organization/dtos/index.ts`

Add export:

```typescript
export * from "./upload-logo.dto";
```

### Step 3: Add Upload Method to Service

**File:** `src/modules/organization/services/organization.service.ts`

Add the `uploadLogo` method:

```typescript
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";

export interface IOrganizationService {
  // ... existing methods ...
  uploadLogo(
    userId: string,
    organizationId: string,
    file: File,
  ): Promise<string>;
}

export class OrganizationService implements IOrganizationService {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private organizationProfileRepository: IOrganizationProfileRepository,
    private transactionManager: TransactionManager,
    private storageService: IObjectStorageService, // NEW
  ) {}

  // ... existing methods ...

  /**
   * Upload organization logo and update profile.
   * Returns the public URL of the uploaded logo.
   */
  async uploadLogo(
    userId: string,
    organizationId: string,
    file: File,
  ): Promise<string> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Verify ownership
      const org = await this.organizationRepository.findById(organizationId, ctx);
      if (!org) {
        throw new OrganizationNotFoundError(organizationId);
      }

      if (org.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      // Upload to storage
      const ext = file.name.split(".").pop() || "png";
      const path = `${organizationId}/logo.${ext}`;

      const result = await this.storageService.upload({
        bucket: STORAGE_BUCKETS.ORGANIZATION_ASSETS,
        path,
        file,
        upsert: true, // Replace existing logo
      });

      // Get or create profile and update logoUrl
      let profile = await this.organizationProfileRepository.findByOrganizationId(
        organizationId,
        ctx,
      );

      if (!profile) {
        profile = await this.organizationProfileRepository.create(
          {
            organizationId,
            logoUrl: result.url,
          },
          ctx,
        );
      } else {
        await this.organizationProfileRepository.update(
          profile.id,
          { logoUrl: result.url },
          ctx,
        );
      }

      logger.info(
        {
          event: "organization.logo_uploaded",
          organizationId,
          url: result.url,
        },
        "Organization logo uploaded",
      );

      return result.url;
    });
  }
}
```

### Step 4: Update Factory

**File:** `src/modules/organization/factories/organization.factory.ts`

```typescript
import { makeObjectStorageService } from "@/modules/storage/factories/storage.factory";

export function makeOrganizationService(): OrganizationService {
  if (!organizationService) {
    organizationService = new OrganizationService(
      makeOrganizationRepository(),
      makeOrganizationProfileRepository(),
      getContainer().transactionManager,
      makeObjectStorageService(), // NEW
    );
  }
  return organizationService;
}
```

### Step 5: Add Upload Endpoint to Router

**File:** `src/modules/organization/organization.router.ts`

```typescript
import { UploadOrganizationLogoSchema } from "./dtos";

export const organizationRouter = router({
  // ... existing endpoints ...

  /**
   * Upload organization logo
   * Accepts FormData with image file
   */
  uploadLogo: protectedProcedure
    .input(UploadOrganizationLogoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const organizationService = makeOrganizationService();
        const url = await organizationService.uploadLogo(
          ctx.userId,
          input.organizationId,
          input.image,
        );
        return { url };
      } catch (error) {
        handleOrganizationError(error);
      }
    }),

  // ... rest of existing endpoints ...
});
```

---

## Frontend Implementation

### Step 6: Create Upload Hook

**File:** `src/features/owner/hooks/use-organization-logo.ts` (NEW)

```typescript
"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to upload organization logo.
 */
export function useUploadOrganizationLogo(organizationId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("image", file);

      return trpc.organization.uploadLogo.mutate(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["organization", "get"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["organization", "my"]],
      });
      toast.success("Logo uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload logo");
    },
  });
}
```

### Step 7: Create Logo Upload Component

**File:** `src/features/owner/components/organization-logo-upload.tsx` (NEW)

```typescript
"use client";

import { useState } from "react";
import { Upload, Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUploadOrganizationLogo } from "../hooks/use-organization-logo";

interface OrganizationLogoUploadProps {
  organizationId: string;
  currentLogoUrl?: string | null;
  organizationName: string;
}

export function OrganizationLogoUpload({
  organizationId,
  currentLogoUrl,
  organizationName,
}: OrganizationLogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const uploadLogo = useUploadOrganizationLogo(organizationId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    await uploadLogo.mutateAsync(file);
    setPreview(null);
  };

  const displayUrl = preview || currentLogoUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Logo preview */}
        <div
          className={cn(
            "relative h-20 w-20 rounded-lg border-2 overflow-hidden",
            "flex items-center justify-center bg-muted",
            uploadLogo.isPending && "opacity-50"
          )}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={organizationName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
          {uploadLogo.isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Upload button */}
        <div>
          <Button
            variant="outline"
            size="sm"
            disabled={uploadLogo.isPending}
            onClick={() => document.getElementById("logo-upload")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {currentLogoUrl ? "Change Logo" : "Upload Logo"}
          </Button>
          <input
            id="logo-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, WebP up to 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## API Specification

### Upload Logo Endpoint

| Property | Value |
|----------|-------|
| Procedure | `organization.uploadLogo` |
| Method | Mutation |
| Auth | Required (protectedProcedure) |
| Input | FormData with `organizationId` and `image` fields |
| Output | `{ url: string }` |

### Input Schema (FormData)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| organizationId | string | Yes | UUID |
| image | File | Yes | Max 5MB, JPEG/PNG/WebP |

### Response

```typescript
{
  url: string; // Public URL to the uploaded logo
}
```

### Error Responses

| Error | HTTP Code | Cause |
|-------|-----------|-------|
| `FILE_TOO_LARGE` | 400 | File exceeds 5MB |
| `INVALID_FILE_TYPE` | 400 | Not JPEG/PNG/WebP |
| `ORGANIZATION_NOT_FOUND` | 404 | Organization doesn't exist |
| `NOT_ORGANIZATION_OWNER` | 403 | User doesn't own the organization |
| `UNAUTHORIZED` | 401 | Not authenticated |

---

## Flow Diagram

```
┌────────────────────────────┐
│ OrganizationLogoUpload     │
│       component            │
└─────────────┬──────────────┘
              │ handleFileSelect(file)
              ▼
┌────────────────────────────┐
│ useUploadOrganizationLogo  │
│        mutation            │
└─────────────┬──────────────┘
              │ FormData { organizationId, image }
              ▼
┌────────────────────────────┐
│        splitLink           │
│      (non-batched)         │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│   organization.uploadLogo  │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│   OrganizationService      │
│      .uploadLogo           │
└─────────────┬──────────────┘
              │
              ├─── Verify ownership
              │
              ├────────────────────────┐
              ▼                        ▼
┌─────────────────────┐   ┌──────────────────────────┐
│  ObjectStorage      │   │  OrganizationProfile     │
│  Service.upload     │   │  Repository.update       │
└─────────┬───────────┘   └──────────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│        Supabase              │
│        Storage               │
│ (organization-assets bucket) │
└──────────────────────────────┘
```

---

## File Structure Changes

```
src/modules/organization/
├── dtos/
│   ├── index.ts                       # Update: add export
│   └── upload-logo.dto.ts             # NEW
├── services/
│   └── organization.service.ts        # Update: add uploadLogo
└── factories/
    └── organization.factory.ts        # Update: add storage service

src/features/owner/
├── hooks/
│   └── use-organization-logo.ts       # NEW
└── components/
    └── organization-logo-upload.tsx   # NEW
```

---

## Testing Checklist

### Backend Tests

- [ ] Upload logo successfully
- [ ] Replace existing logo (upsert)
- [ ] Reject file > 5MB
- [ ] Reject non-image file
- [ ] Reject for non-owner (FORBIDDEN)
- [ ] Reject for non-existent organization (NOT_FOUND)
- [ ] Logo URL saved to organization_profile table
- [ ] Profile auto-created if doesn't exist

### Frontend Tests

- [ ] File selection shows preview
- [ ] Loading state during upload
- [ ] New logo displayed after success
- [ ] Error toast on failure
- [ ] Query cache invalidated
- [ ] "Change Logo" button shown for existing logo

### E2E Tests

- [ ] Complete flow: select file -> upload -> see new logo
- [ ] Error flow: non-owner tries to upload -> see error

---

## Prerequisites

Before testing:

1. **Supabase bucket exists:** `organization-assets`
2. **Bucket is configured:** Public read for logos
3. **Environment variables set:**
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`

---

## Integration Points

- **Organization Settings Page:** Add `OrganizationLogoUpload` to settings form
- **Public Organization Page:** Display logo on organization public profile
- **Court Cards:** Show organization logo on court listings

---

## Notes

- Logo path format: `{organizationId}/logo.{ext}` (single logo per org)
- Uses `upsert: true` to replace existing logo
- Profile auto-created if it doesn't exist
- Same developer as court photos (Dev 2) - can reuse patterns
