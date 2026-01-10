# P2P Reservation Confirmation - Developer Checklist

**Focus Area:** Full P2P payment verification flow  
**User Stories:** US-08-01 through US-08-03  
**Estimated Time:** 7-11 hours

---

## Prerequisites

Before starting, ensure:

- [ ] Domains 06 (Court Reservation) and 07 (Owner Confirmation) are complete
- [ ] Payment page exists at `/reservations/[id]/payment`
- [ ] `reservation.expiresAt` is set on paid reservations
- [ ] `payment_proof` table exists
- [ ] `reservable_court_detail` has payment fields

---

## Phase 1: Backend Enhancements

**Reference:** `08-01-backend-enhancements.md`  
**Dependencies:** None

### Module 1A: Payment Details Endpoint

- [ ] Open `src/modules/time-slot/repositories/time-slot.repository.ts`
- [ ] Add left join for `reservable_court_detail`
- [ ] Return payment details in `getById` response
- [ ] Update DTO in `src/modules/time-slot/dtos/`
- [ ] Regenerate types: `npm run generate:types`
- [ ] Test: `timeSlot.getById` returns paymentDetails

### Module 1B: Owner Proof Response

- [ ] Open `src/modules/reservation-owner/repositories/reservation-owner.repository.ts`
- [ ] Add left join for `payment_proof`
- [ ] Return proof in `getForOrganization` response
- [ ] Handle null proof (convert empty object to null)
- [ ] Update DTO in `src/modules/reservation-owner/dtos/`
- [ ] Regenerate types
- [ ] Test: Owner response includes paymentProof

### Module 1C: Vercel Cron Config

- [ ] Check if `vercel.json` exists, create if not
- [ ] Add crons configuration:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/expire-reservations",
        "schedule": "* * * * *"
      }
    ]
  }
  ```
- [ ] Generate CRON_SECRET: `openssl rand -hex 32`
- [ ] Add to Vercel environment variables
- [ ] Test locally: `curl http://localhost:3000/api/cron/expire-reservations`
- [ ] Deploy and verify cron runs

---

## Phase 2: Payment Page Enhancements

**Reference:** `08-02-payment-page-enhancements.md`  
**Dependencies:** Module 1A complete

### Module 2A: Countdown Timer

- [ ] Create `src/features/reservation/components/countdown-timer.tsx`
- [ ] Implement timer with warning state (< 5 min)
- [ ] Implement expired state
- [ ] Open `src/app/(auth)/reservations/[id]/payment/page.tsx`
- [ ] Add `isExpired` state
- [ ] Add initial expiration check on load
- [ ] Integrate CountdownTimer component
- [ ] Disable button when expired
- [ ] Test: Timer counts down
- [ ] Test: Warning state at < 5 min
- [ ] Test: Expired disables button

### Module 2B: Payment Instructions

- [ ] Create `src/features/reservation/components/payment-instructions.tsx`
- [ ] Create copy button component
- [ ] Implement GCash display
- [ ] Implement bank display
- [ ] Implement fallback for no details
- [ ] Integrate in payment page
- [ ] Pass `slot?.paymentDetails` to component
- [ ] Test: GCash displays when configured
- [ ] Test: Copy button works
- [ ] Test: Fallback shows when no details

### Module 2C: T&C Checkbox

- [ ] Create `src/features/reservation/components/terms-checkbox.tsx`
- [ ] Add `termsAccepted` state to payment page
- [ ] Integrate TermsCheckbox component
- [ ] Update button disabled state
- [ ] Test: Button disabled when unchecked
- [ ] Test: Button enabled when checked
- [ ] Test: T&C link opens

### Module 2D: Payment Proof Form

- [ ] Create `src/features/reservation/components/payment-proof-form.tsx`
- [ ] Add `referenceNumber`, `notes` state to payment page
- [ ] Import `paymentProof.add` mutation
- [ ] Update `handleMarkPaid` to submit proof if filled
- [ ] Integrate PaymentProofForm component
- [ ] Test: Can submit without proof
- [ ] Test: Proof saved when filled
- [ ] Test: Check `payment_proof` table

### Integration

- [ ] Update payment page layout order:
  1. Countdown timer
  2. Reservation details (existing)
  3. Payment instructions
  4. Payment proof form
  5. T&C checkbox
  6. Submit button
- [ ] Remove old placeholder instructions
- [ ] Run build: `npm run build`
- [ ] Fix any TypeScript errors

---

## Phase 3: Owner Proof Review

**Reference:** `08-03-owner-proof-review.md`  
**Dependencies:** Module 1B complete

### Module 3A: Proof Card Component

- [ ] Create `src/features/owner/components/payment-proof-card.tsx`
- [ ] Handle null proof (show "No proof provided")
- [ ] Display reference number with copy
- [ ] Display notes
- [ ] Display timestamp

### Module 3B: Image Preview

- [ ] Create `src/features/owner/components/image-preview.tsx`
- [ ] Implement thumbnail with Dialog
- [ ] Handle image load errors
- [ ] (Note: Only functional when US-10-02 complete)

### Integration

- [ ] Update `src/features/owner/hooks/use-owner-reservations.ts`
  - [ ] Add paymentProof to mapped type
  - [ ] Map proof from response
- [ ] Integrate PaymentProofCard in reservation list
- [ ] Test: Proof card shows for reservation with proof
- [ ] Test: "No proof" shows for reservation without

---

## Phase 4: Expiration Handling

**Reference:** `08-04-expiration-handling.md`  
**Dependencies:** Module 2A complete

### Module 4A: Expired UI Component

- [ ] Create `src/features/reservation/components/reservation-expired.tsx`
- [ ] Show slot details
- [ ] Include "Book Again" button
- [ ] Integrate in payment page (show when expired)
- [ ] Integrate in reservation detail page

### Module 4B: Status Badges

- [ ] Create `src/features/reservation/utils/status-display.ts`
- [ ] Create `src/features/reservation/components/status-badge.tsx`
- [ ] Define all status configurations including EXPIRED

### Module 4C: My Reservations

- [ ] Update My Reservations page to use StatusBadge
- [ ] Add muted styling for expired reservations
- [ ] Ensure expired reservations are visible (not hidden)

---

## Final Verification

### End-to-End Test

- [ ] Create new paid reservation
- [ ] Verify timer starts at 15 minutes
- [ ] Verify payment instructions display
- [ ] Check T&C required
- [ ] Fill proof fields and submit
- [ ] Verify as owner: see proof on pending reservation
- [ ] Confirm reservation
- [ ] Verify all states update correctly

### Expiration Test

- [ ] Create paid reservation
- [ ] Set `expiresAt` to past in database
- [ ] Trigger cron or wait for timer
- [ ] Verify payment page shows expired
- [ ] Verify slot released (status: AVAILABLE)
- [ ] Verify My Reservations shows expired badge

### Build Check

- [ ] Run `npm run build`
- [ ] Run `npm run lint`
- [ ] Fix any errors
- [ ] Deploy to staging

---

## Completion Checklist

- [ ] Phase 1 complete: Backend enhancements
- [ ] Phase 2 complete: Payment page UI
- [ ] Phase 3 complete: Owner proof review
- [ ] Phase 4 complete: Expiration handling
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Deployed to staging
- [ ] Verified end-to-end flow

---

## Notes

- File upload (screenshot) depends on US-10-02 in `10-asset-uploads` domain
- Initially implement proof form without file upload
- Add file upload integration when US-10-02 is complete
- Cron job requires Vercel Pro plan (or alternative scheduler)
