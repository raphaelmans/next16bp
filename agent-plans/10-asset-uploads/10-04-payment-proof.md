# Phase 2C: Payment Proof Upload

**Dependencies:** Phase 1 complete (DONE)
**Parallelizable:** Yes (with 2A, 2B, 2D)
**User Story:** US-10-02 - Player Uploads Payment Proof
**Developer:** Dev 3
**Status:** Ready to Implement

---

## Objective

Implement payment proof upload functionality:
- Add `upload` endpoint to payment-proof router (accepts FormData)
- Upload file to Supabase storage via `ObjectStorageService`
- Create proof record using existing business logic
- Validate reservation ownership and status
- Support larger file size (10MB for screenshots)

---

## Current State

The payment-proof module already exists with:

**Existing:**
- `payment-proof.router.ts` - Has `add`, `update`, `get` endpoints
- `payment-proof.service.ts` - Has `addPaymentProof` with ownership/status validation
- `add-payment-proof.dto.ts` - Takes `fileUrl` (URL), not File
- Business rules: Only reservation owner, only AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER status

**What's Missing:**
- Upload DTO for FormData
- `uploadProof` method that accepts file and uploads to storage
- Storage service integration
- Frontend hook for file upload

---

## Implementation Strategy

Add a new `upload` endpoint that:
1. Accepts FormData with file + metadata
2. Uploads to Supabase storage
3. Calls existing `addPaymentProof` with the URL

This reuses all existing validation and business logic.

---

## Implementation Steps

### Step 1: Create Upload Proof DTO

**File:** `src/modules/payment-proof/dtos/upload-proof.dto.ts` (NEW)

```typescript
import { z } from "zod";
import { zfd } from "zod-form-data";
import { paymentProofFileSchema } from "@/modules/storage/dtos";

/**
 * Schema for payment proof upload FormData.
 * Allows larger files (10MB) for screenshot uploads.
 */
export const UploadPaymentProofSchema = zfd.formData({
  reservationId: zfd.text(z.string().uuid()),
  image: paymentProofFileSchema,
  referenceNumber: zfd.text(z.string().max(100)).optional(),
  notes: zfd.text(z.string().max(500)).optional(),
});

export type UploadPaymentProofInput = {
  reservationId: string;
  image: File;
  referenceNumber?: string;
  notes?: string;
};
```

### Step 2: Update DTOs Index

**File:** `src/modules/payment-proof/dtos/index.ts`

Add export:

```typescript
export * from "./upload-proof.dto";
```

### Step 3: Add Upload Method to Service

**File:** `src/modules/payment-proof/services/payment-proof.service.ts`

Add the `uploadProof` method:

```typescript
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import { STORAGE_BUCKETS } from "@/modules/storage/dtos";

export interface IPaymentProofService {
  // ... existing methods ...
  uploadProof(
    userId: string,
    reservationId: string,
    file: File,
    referenceNumber?: string,
    notes?: string,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord>;
}

export class PaymentProofService implements IPaymentProofService {
  constructor(
    private paymentProofRepository: IPaymentProofRepository,
    private reservationRepository: IReservationRepository,
    private profileRepository: IProfileRepository,
    private storageService: IObjectStorageService, // NEW
  ) {}

  // ... existing methods ...

  /**
   * Upload payment proof image and create record.
   */
  async uploadProof(
    userId: string,
    reservationId: string,
    file: File,
    referenceNumber?: string,
    notes?: string,
    ctx?: RequestContext,
  ): Promise<PaymentProofRecord> {
    // Validate reservation access (reuse existing validation)
    const reservation = await this.reservationRepository.findById(
      reservationId,
      ctx,
    );
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    const profile = await this.profileRepository.findByUserId(userId, ctx);
    if (!profile || reservation.playerId !== profile.id) {
      throw new NotReservationOwnerError();
    }

    if (!ALLOWED_STATUSES_FOR_PROOF.includes(reservation.status)) {
      throw new InvalidReservationStatusError(
        `Cannot add payment proof for reservation in ${reservation.status} status`,
      );
    }

    // Check for existing proof
    const existing = await this.paymentProofRepository.findByReservationId(
      reservationId,
      ctx,
    );
    if (existing) {
      throw new PaymentProofAlreadyExistsError(reservationId);
    }

    // Upload to storage
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${reservationId}/${timestamp}.${ext}`;

    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.PAYMENT_PROOFS,
      path,
      file,
      upsert: false,
    });

    // Create proof record using existing logic
    const proof = await this.paymentProofRepository.create(
      {
        reservationId,
        fileUrl: result.url,
        referenceNumber,
        notes,
      },
      ctx,
    );

    logger.info(
      {
        event: "payment_proof.uploaded",
        reservationId,
        proofId: proof.id,
        userId,
        url: result.url,
      },
      "Payment proof uploaded",
    );

    return proof;
  }
}
```

### Step 4: Update Factory

**File:** `src/modules/payment-proof/factories/payment-proof.factory.ts`

```typescript
import { makeObjectStorageService } from "@/modules/storage/factories/storage.factory";

export function makePaymentProofService() {
  if (!paymentProofService) {
    paymentProofService = new PaymentProofService(
      makePaymentProofRepository(),
      makeReservationRepository(),
      makeProfileRepository(),
      makeObjectStorageService(), // NEW
    );
  }
  return paymentProofService;
}
```

### Step 5: Add Upload Endpoint to Router

**File:** `src/modules/payment-proof/payment-proof.router.ts`

```typescript
import { UploadPaymentProofSchema } from "./dtos";

export const paymentProofRouter = router({
  // ... existing endpoints ...

  /**
   * Upload payment proof image
   * Accepts FormData with image file
   */
  upload: protectedProcedure
    .input(UploadPaymentProofSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makePaymentProofService();
      return service.uploadProof(
        ctx.userId,
        input.reservationId,
        input.image,
        input.referenceNumber,
        input.notes,
      );
    }),

  // Keep existing add for URL-based additions
  add: protectedProcedure
    .input(AddPaymentProofSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makePaymentProofService();
      return service.addPaymentProof(ctx.userId, input);
    }),

  // ... rest of existing endpoints ...
});
```

---

## Frontend Implementation

### Step 6: Create Upload Hook

**File:** `src/features/reservation/hooks/use-payment-proof.ts` (NEW or Update)

```typescript
"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to get payment proof for a reservation.
 */
export function usePaymentProof(reservationId: string) {
  const trpc = useTRPC();

  return useQuery({
    queryKey: [["paymentProof", "get"], { reservationId }],
    queryFn: () => trpc.paymentProof.get.query({ reservationId }),
    retry: false, // Don't retry on 404 (no proof yet)
  });
}

/**
 * Hook to upload payment proof.
 */
export function useUploadPaymentProof(reservationId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      referenceNumber?: string;
      notes?: string;
    }) => {
      const formData = new FormData();
      formData.append("reservationId", reservationId);
      formData.append("image", data.file);
      if (data.referenceNumber) {
        formData.append("referenceNumber", data.referenceNumber);
      }
      if (data.notes) {
        formData.append("notes", data.notes);
      }

      return trpc.paymentProof.upload.mutate(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["paymentProof", "get"], { reservationId }],
      });
      queryClient.invalidateQueries({
        queryKey: [["reservation"]],
      });
      toast.success("Payment proof uploaded");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload payment proof");
    },
  });
}
```

### Step 7: Create Payment Proof Upload Component

**File:** `src/features/reservation/components/payment-proof-upload.tsx` (NEW)

```typescript
"use client";

import { useState } from "react";
import { Upload, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUploadPaymentProof, usePaymentProof } from "../hooks/use-payment-proof";

interface PaymentProofUploadProps {
  reservationId: string;
  onSuccess?: () => void;
}

export function PaymentProofUpload({
  reservationId,
  onSuccess,
}: PaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const { data: existingProof } = usePaymentProof(reservationId);
  const uploadProof = useUploadPaymentProof(reservationId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    await uploadProof.mutateAsync({
      file,
      referenceNumber: referenceNumber || undefined,
    });

    // Reset form
    setFile(null);
    setPreview(null);
    setReferenceNumber("");
    onSuccess?.();
  };

  // If proof already exists, show it
  if (existingProof) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span>Payment proof uploaded</span>
        </div>
        {existingProof.fileUrl && (
          <a
            href={existingProof.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={existingProof.fileUrl}
              alt="Payment proof"
              className="max-w-xs rounded-lg border"
            />
          </a>
        )}
        {existingProof.referenceNumber && (
          <p className="text-sm text-muted-foreground">
            Reference: {existingProof.referenceNumber}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File upload area */}
      <div>
        <Label htmlFor="proof-file">Payment Screenshot</Label>
        <div
          className={cn(
            "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary",
            preview && "border-primary"
          )}
          onClick={() => document.getElementById("proof-file")?.click()}
        >
          <input
            id="proof-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-48 rounded"
            />
          ) : (
            <>
              <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload payment screenshot
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP up to 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Reference number */}
      <div>
        <Label htmlFor="reference-number">Reference Number (Optional)</Label>
        <Input
          id="reference-number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="e.g., GCash reference number"
          maxLength={100}
          className="mt-1"
        />
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!file || uploadProof.isPending}
        className="w-full"
      >
        {uploadProof.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Proof
          </>
        )}
      </Button>
    </div>
  );
}
```

---

## API Specification

### Upload Endpoint

| Property | Value |
|----------|-------|
| Procedure | `paymentProof.upload` |
| Method | Mutation |
| Auth | Required (protectedProcedure) |
| Input | FormData with `reservationId`, `image`, optional `referenceNumber`, `notes` |
| Output | `PaymentProofRecord` |

### Input Schema (FormData)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| reservationId | string | Yes | UUID |
| image | File | Yes | Max 10MB, JPEG/PNG/WebP |
| referenceNumber | string | No | Max 100 chars |
| notes | string | No | Max 500 chars |

### Response

```typescript
{
  id: string;
  reservationId: string;
  fileUrl: string;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Error Responses

| Error | HTTP Code | Cause |
|-------|-----------|-------|
| `FILE_TOO_LARGE` | 400 | File exceeds 10MB |
| `INVALID_FILE_TYPE` | 400 | Not JPEG/PNG/WebP |
| `RESERVATION_NOT_FOUND` | 404 | Reservation doesn't exist |
| `NOT_RESERVATION_OWNER` | 403 | User doesn't own the reservation |
| `INVALID_RESERVATION_STATUS` | 400 | Reservation not in valid status |
| `PAYMENT_PROOF_ALREADY_EXISTS` | 409 | Proof already uploaded |
| `UNAUTHORIZED` | 401 | Not authenticated |

---

## Flow Diagram

```
┌────────────────────┐
│ PaymentProofUpload │
│    component       │
└─────────┬──────────┘
          │ handleSubmit()
          ▼
┌────────────────────────┐
│ useUploadPaymentProof  │
│      mutation          │
└─────────┬──────────────┘
          │ FormData { reservationId, image, referenceNumber }
          ▼
┌────────────────────┐
│     splitLink      │
│   (non-batched)    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  paymentProof.     │
│     upload         │
└─────────┬──────────┘
          │
          ▼
┌────────────────────────┐
│  PaymentProofService   │
│     .uploadProof       │
└─────────┬──────────────┘
          │
          ├─── Validate reservation ownership
          ├─── Validate reservation status
          ├─── Check no existing proof
          │
          ├────────────────────────┐
          ▼                        ▼
┌─────────────────────┐   ┌────────────────────────┐
│  ObjectStorage      │   │  PaymentProof          │
│  Service.upload     │   │  Repository.create     │
└─────────┬───────────┘   └────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│      Supabase           │
│      Storage            │
│ (payment-proofs bucket) │
└─────────────────────────┘
```

---

## File Structure Changes

```
src/modules/payment-proof/
├── dtos/
│   ├── index.ts                  # Update: add export
│   ├── add-payment-proof.dto.ts  # Existing (URL-based)
│   └── upload-proof.dto.ts       # NEW (FormData)
├── services/
│   └── payment-proof.service.ts  # Update: add uploadProof
└── factories/
    └── payment-proof.factory.ts  # Update: add storage service

src/features/reservation/
├── hooks/
│   └── use-payment-proof.ts      # NEW or update
└── components/
    └── payment-proof-upload.tsx  # NEW
```

---

## Security Considerations

1. **Ownership Check:** Player can only upload for their own reservations
2. **Status Check:** Only AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER allowed
3. **Single Proof:** Only one proof per reservation (enforced by existing logic)
4. **Private Bucket:** Payment proofs stored in private bucket
5. **Owner Access:** Court owners can view proofs via reservation endpoints

---

## Testing Checklist

### Backend Tests

- [ ] Upload proof for AWAITING_PAYMENT reservation
- [ ] Upload proof for PAYMENT_MARKED_BY_USER reservation
- [ ] Reject upload for other user's reservation
- [ ] Reject upload for CONFIRMED reservation
- [ ] Reject upload for EXPIRED reservation
- [ ] Reject upload for CANCELLED reservation
- [ ] Reject duplicate proof (already exists)
- [ ] Reject file > 10MB
- [ ] Reject non-image file
- [ ] Reference number saved correctly
- [ ] Notes saved correctly

### Frontend Tests

- [ ] File selection shows preview
- [ ] Loading state during upload
- [ ] Success state shows uploaded proof
- [ ] Error toast on failure
- [ ] Reference number field works
- [ ] Query cache invalidated

### E2E Tests

- [ ] Complete flow: select file -> add reference -> upload -> see proof
- [ ] Error flow: try upload for wrong reservation -> see error

---

## Prerequisites

Before testing:

1. **Supabase bucket exists:** `payment-proofs`
2. **Bucket is configured:** Private
3. **Environment variables set:**
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`

---

## Integration Points

- **Payment Page:** Add `PaymentProofUpload` component to reservation payment page
- **Owner Dashboard:** Display proof in reservation detail modal (use signed URLs for private access)
- **Reservation Status:** Consider auto-updating status after proof upload

---

## Notes

- Path format: `{reservationId}/{timestamp}.{ext}`
- 10MB limit (larger than other uploads for full-page screenshots)
- Single proof per reservation (existing business rule)
- Uses `paymentProofFileSchema` which has 10MB limit
