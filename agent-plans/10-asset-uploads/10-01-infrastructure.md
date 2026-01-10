# Phase 1: Infrastructure - COMPLETE

**Dependencies:** None
**Parallelizable:** No (must complete before Phase 2)
**User Stories:** Foundation for all US-10-* stories
**Status:** **COMPLETE**

---

## Summary

Phase 1 infrastructure has been fully implemented. All Phase 2 features can now start development in parallel.

---

## Completed Components

### 1A: tRPC FormData Configuration

#### Package Installation (Complete)

```bash
bun add zod-form-data
```

The `zod-form-data` package is installed and working with Zod v4.

#### tRPC Client Configuration (Complete)

**File:** `src/components/providers.tsx`

The tRPC client is configured with `splitLink` to route FormData requests to a non-batched endpoint:

```typescript
"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  splitLink,
  isNonJsonSerializable,
} from "@trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TRPCProvider } from "@/trpc/client";
import { getQueryClient } from "@/trpc/query-client";
import type { AppRouter } from "@/shared/infra/trpc/root";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          // Route FormData/File/Blob to non-batched endpoint
          // httpLink handles non-JSON content types natively in tRPC v11
          condition: (op) => isNonJsonSerializable(op.input),
          true: httpLink({
            url: `${getBaseUrl()}/api/trpc`,
          }),
          // Regular JSON uses batched endpoint for efficiency
          false: httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
          }),
        }),
      ],
    }),
  );

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
```

**Key Points:**
- tRPC v11 handles FormData natively (no custom transformer needed)
- `isNonJsonSerializable` detects FormData, File, Blob, ReadableStream
- FormData requests use `httpLink` (non-batched)
- Regular JSON requests use `httpBatchLink` (batched for efficiency)

---

### 1B: Storage Module (Complete)

#### Directory Structure

```
src/modules/storage/
├── storage.router.ts           # Empty router (uploads in domain routers)
├── errors/
│   └── storage.errors.ts       # Storage-specific errors
├── services/
│   └── object-storage.service.ts # Supabase Storage wrapper
├── factories/
│   └── storage.factory.ts      # Factory for storage service
└── dtos/
    ├── index.ts                # Re-exports
    └── upload.dto.ts           # Common upload DTOs & schemas
```

#### Storage Errors (Complete)

**File:** `src/modules/storage/errors/storage.errors.ts`

```typescript
import { BusinessRuleError, InternalError } from "@/shared/kernel/errors";

export class StorageUploadError extends InternalError {
  readonly code = "STORAGE_UPLOAD_FAILED";
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class StorageDeleteError extends InternalError {
  readonly code = "STORAGE_DELETE_FAILED";
  constructor(path: string) {
    super("Failed to delete file", { path });
  }
}

export class InvalidFileTypeError extends BusinessRuleError {
  readonly code = "INVALID_FILE_TYPE";
  constructor(fileType: string, allowedTypes: string[]) {
    super(
      `Invalid file type: ${fileType}. Allowed: ${allowedTypes.join(", ")}`,
      { fileType, allowedTypes }
    );
  }
}

export class FileTooLargeError extends BusinessRuleError {
  readonly code = "FILE_TOO_LARGE";
  constructor(fileSize: number, maxSize: number) {
    super(`File too large: ${fileSize} bytes. Max: ${maxSize} bytes`, {
      fileSize,
      maxSize,
    });
  }
}

export class SignedUrlError extends InternalError {
  readonly code = "SIGNED_URL_FAILED";
  constructor(path: string) {
    super("Failed to generate signed URL", { path });
  }
}
```

#### Upload DTOs (Complete)

**File:** `src/modules/storage/dtos/upload.dto.ts`

```typescript
import { z } from "zod";
import { zfd } from "zod-form-data";

// Constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PAYMENT_PROOF_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const FILE_SIZE_LIMITS_READABLE = {
  PROFILE_IMAGE: "5MB",
  COURT_PHOTO: "5MB",
  ORG_LOGO: "5MB",
  PAYMENT_PROOF: "10MB",
} as const;

// Bucket names
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  PAYMENT_PROOFS: "payment-proofs",
  COURT_PHOTOS: "court-photos",
  ORGANIZATION_ASSETS: "organization-assets",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// File validation schemas
export const imageFileSchema = zfd
  .file()
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `File must be less than ${FILE_SIZE_LIMITS_READABLE.PROFILE_IMAGE}`,
  })
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      ),
    { message: "File must be JPEG, PNG, or WebP" }
  );

export const paymentProofFileSchema = zfd
  .file()
  .refine((file) => file.size <= MAX_PAYMENT_PROOF_SIZE, {
    message: `File must be less than ${FILE_SIZE_LIMITS_READABLE.PAYMENT_PROOF}`,
  })
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      ),
    { message: "File must be JPEG, PNG, or WebP" }
  );

// Types
export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  contentType?: string;
  upsert?: boolean;
}
```

#### Object Storage Service (Complete)

**File:** `src/modules/storage/services/object-storage.service.ts`

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  StorageUploadError,
  StorageDeleteError,
  InvalidFileTypeError,
  FileTooLargeError,
  SignedUrlError,
} from "../errors/storage.errors";
import {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  type UploadOptions,
  type UploadResult,
  type StorageBucket,
} from "../dtos";

export interface IObjectStorageService {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(bucket: StorageBucket, path: string): Promise<void>;
  getPublicUrl(bucket: StorageBucket, path: string): string;
  createSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn: number
  ): Promise<string>;
}

export class ObjectStorageService implements IObjectStorageService {
  private readonly client: SupabaseClient;

  constructor() {
    // Uses service role key for server-side uploads (bypasses RLS)
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { bucket, path, file, contentType, upsert = false } = options;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new FileTooLargeError(file.size, MAX_FILE_SIZE);
    }

    // Validate file type
    const fileType = file.type as (typeof ALLOWED_IMAGE_TYPES)[number];
    if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      throw new InvalidFileTypeError(file.type, [...ALLOWED_IMAGE_TYPES]);
    }

    // Convert File to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: contentType ?? file.type,
        upsert,
      });

    if (error) {
      throw new StorageUploadError(error.message, { bucket, path });
    }

    const url = this.getPublicUrl(bucket, data.path);
    return { url, path: data.path };
  }

  async delete(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([path]);
    if (error) {
      throw new StorageDeleteError(path);
    }
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async createSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn: number
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new SignedUrlError(path);
    }
    return data.signedUrl;
  }
}
```

#### Storage Factory (Complete)

**File:** `src/modules/storage/factories/storage.factory.ts`

```typescript
import {
  ObjectStorageService,
  type IObjectStorageService,
} from "../services/object-storage.service";

let objectStorageService: IObjectStorageService | null = null;

export function makeObjectStorageService(): IObjectStorageService {
  if (!objectStorageService) {
    objectStorageService = new ObjectStorageService();
  }
  return objectStorageService;
}
```

---

## Supabase Bucket RLS Policies

Configure these in Supabase Dashboard > Storage > Policies:

### All Buckets (Service Role)

Since we use server-side uploads with the service role key, RLS is bypassed for uploads. The policies below are for potential future client-side access.

### Avatars Bucket

```sql
-- Users can view their own avatar
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public can view avatars (for profile pages)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### Payment Proofs Bucket

```sql
-- Only accessible via service role (server-side)
-- No client policies needed - all access through API
```

### Court Photos Bucket

```sql
-- All users can view court photos
CREATE POLICY "Public can view court photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'court-photos');
```

### Organization Assets Bucket

```sql
-- All users can view organization logos
CREATE POLICY "Public can view org assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-assets');
```

---

## Phase 1 Verification Checklist

- [x] `zod-form-data` installed
- [x] tRPC client uses `splitLink` for FormData routing
- [x] `isNonJsonSerializable` correctly detects FormData
- [x] Storage module directory structure created
- [x] `StorageUploadError`, `StorageDeleteError`, `InvalidFileTypeError`, `FileTooLargeError`, `SignedUrlError` classes
- [x] `imageFileSchema`, `paymentProofFileSchema` with zfd
- [x] `STORAGE_BUCKETS` constant with all bucket names
- [x] `ObjectStorageService` with upload, delete, getPublicUrl, createSignedUrl
- [x] `makeObjectStorageService` factory function
- [x] TypeScript compiles without errors

---

## Phase 2 Readiness

All infrastructure is in place. Phase 2 features can now be implemented in parallel:

| Feature | Ready | Dependencies Met |
|---------|-------|------------------|
| Avatar Upload (2A) | Yes | Storage module complete |
| Court Photos (2B) | Yes | Storage module complete |
| Payment Proof (2C) | Yes | Storage module complete |
| Org Logo (2D) | Yes | Storage module complete |

### How to Use Storage Service in Phase 2

```typescript
import { makeObjectStorageService } from "@/modules/storage/factories/storage.factory";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";

// In your service
const storageService = makeObjectStorageService();

const result = await storageService.upload({
  bucket: STORAGE_BUCKETS.AVATARS,
  path: `${userId}/avatar.jpg`,
  file: fileFromFormData,
  upsert: true,
});

console.log(result.url); // Public URL to the uploaded file
```

---

## Notes

- **No custom transformer needed:** tRPC v11 handles FormData natively
- **Service role key:** All uploads bypass RLS for simplicity
- **File validation:** Happens in both DTO (zfd) and service layer
- **Upsert support:** Set `upsert: true` to replace existing files
