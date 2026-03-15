# Developer 3 Checklist - Payment Proof Upload

**Focus Area:** Player payment proof upload
**Modules:** 2C
**Status:** Phase 1 COMPLETE - Ready to start Phase 2

---

## Prerequisites

- [x] Phase 1 is complete (storage module implemented)
- [ ] Create bucket in Supabase Dashboard:
  - [ ] `payment-proofs` (private)
- [ ] Configure bucket RLS (see `10-01-infrastructure.md`)

---

## Phase 2C: Payment Proof Upload

**Reference:** `10-04-payment-proof.md`
**User Story:** US-10-02

### Existing Code to Leverage

The payment-proof module already has:
- `payment-proof.router.ts` - `add`, `update`, `get` endpoints
- `payment-proof.service.ts` - `addPaymentProof` with validation
- Business rules: Only reservation owner, valid status check
- `add-payment-proof.dto.ts` - Takes URL (you're adding file upload)

You're adding FormData upload that uses the existing validation.

### Backend

#### DTOs

- [ ] Create `src/modules/payment-proof/dtos/upload-proof.dto.ts`
  - [ ] `UploadPaymentProofSchema` with zfd
  - [ ] `reservationId` - UUID string
  - [ ] `image` - File (using `paymentProofFileSchema` for 10MB limit)
  - [ ] `referenceNumber` - optional string
  - [ ] `notes` - optional string
  - [ ] Export from `dtos/index.ts`

#### Service Updates

- [ ] Update `src/modules/payment-proof/services/payment-proof.service.ts`
  - [ ] Add `IObjectStorageService` to constructor
  - [ ] Add `uploadProof(userId, reservationId, file, referenceNumber?, notes?)` method:
    - [ ] Validate reservation exists
    - [ ] Validate user owns reservation (via profile check)
    - [ ] Validate status: AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER
    - [ ] Check no existing proof
    - [ ] Generate path: `{reservationId}/{timestamp}.{ext}`
    - [ ] Upload to `payment-proofs` bucket
    - [ ] Create proof record with `fileUrl`
    - [ ] Return proof record

#### Factory Updates

- [ ] Update `src/modules/payment-proof/factories/payment-proof.factory.ts`
  - [ ] Import `makeObjectStorageService`
  - [ ] Add to `makePaymentProofService` constructor

#### Router Updates

- [ ] Update `src/modules/payment-proof/payment-proof.router.ts`
  - [ ] Import `UploadPaymentProofSchema`
  - [ ] Add `upload` procedure
  - [ ] Keep existing `add` for URL-based additions
  - [ ] Return payment proof record

### Frontend

#### Hooks

- [ ] Create `src/features/reservation/hooks/use-payment-proof.ts`
  - [ ] `usePaymentProof(reservationId)` - fetch proof
  - [ ] `useUploadPaymentProof(reservationId)` - upload mutation
  - [ ] FormData: `reservationId`, `image`, optional `referenceNumber`, `notes`
  - [ ] Invalidate `paymentProof.get` and `reservation` queries
  - [ ] Toast notifications

#### Components

- [ ] Create `src/features/reservation/components/payment-proof-upload.tsx`
  - [ ] File upload area (click or drop)
  - [ ] Image preview
  - [ ] Reference number input (optional)
  - [ ] Submit button
  - [ ] Loading state during upload
  - [ ] Success state showing uploaded proof
  - [ ] Existing proof display if already uploaded

### Integration

- [ ] Add `PaymentProofUpload` to payment page
  - [ ] Show when reservation is AWAITING_PAYMENT
  - [ ] Show existing proof if already uploaded
  - [ ] Success callback to advance flow

- [ ] Owner reservation detail view
  - [ ] Display payment proof image
  - [ ] Show reference number if provided

### Testing

#### Happy Path

- [ ] Upload proof for AWAITING_PAYMENT reservation
- [ ] Upload proof for PAYMENT_MARKED_BY_USER reservation
- [ ] Reference number saved correctly
- [ ] Notes saved correctly
- [ ] File URL saved to database
- [ ] Loading state shown
- [ ] Success toast shown

#### Error Cases

- [ ] Reject upload for other user's reservation (403)
- [ ] Reject upload for CONFIRMED reservation
- [ ] Reject upload for EXPIRED reservation
- [ ] Reject upload for CANCELLED reservation
- [ ] Reject duplicate proof (already exists - 409)
- [ ] Reject file > 10MB
- [ ] Reject non-image file

#### UI/UX

- [ ] Preview shown after file selection
- [ ] Loading state during upload
- [ ] Success state shows uploaded proof
- [ ] Error toast with helpful message
- [ ] Query cache invalidated

---

## Security Verification

- [ ] Player can only upload for own reservations
- [ ] Player cannot upload for others' reservations
- [ ] Status validation prevents late uploads
- [ ] Single proof per reservation enforced
- [ ] Owner can view proof (for verification)
- [ ] Payment proofs in private bucket

---

## Final Verification

- [ ] `bun run typecheck` passes
- [ ] `bun run build` succeeds
- [ ] Manual E2E test: Complete payment proof flow
  - [ ] Create/find AWAITING_PAYMENT reservation
  - [ ] Navigate to payment page
  - [ ] Upload proof with reference number
  - [ ] Verify proof visible in UI
  - [ ] Verify owner can see proof
- [ ] Update `10-00-overview.md` to mark Phase 2C complete
