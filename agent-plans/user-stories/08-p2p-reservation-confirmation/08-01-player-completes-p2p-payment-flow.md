# US-08-01: Player Completes P2P Payment Flow

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**PRD Reference:** Section 7 Journey 3, Section 8.4, Section 17  
**Enhances:** US-06-02 (Player Books Paid Court)

---

## Story

As a **player**, I want to **complete the full P2P payment flow with timer, instructions, and proof** so that **I can provide payment verification to the court owner and understand the payment deadline**.

---

## Context

This parent story enhances the simplified payment flow from US-06-02 with:
- 15-minute countdown timer (TTL)
- Owner's actual payment instructions (GCash, bank details)
- Explicit Terms & Conditions acknowledgment
- Payment proof submission (reference number, notes, optional screenshot)

### Current State (Simplified)

The payment page at `/reservations/[id]/payment` currently:
- Shows generic "Contact the court owner" text
- Has no countdown timer
- Auto-sends `termsAccepted: true` without explicit checkbox
- No payment proof fields

**Current Payment Page Location:** `src/app/(auth)/reservations/[id]/payment/page.tsx`

### Target State (Full P2P)

After implementing sub-stories:
- Countdown timer showing time remaining before expiration
- Owner's GCash number, bank account displayed
- Explicit T&C checkbox with legal disclaimer
- Optional proof form (reference number, notes, file upload)

---

## Sub-Stories

| ID | Story | Focus | Priority |
|----|-------|-------|----------|
| US-08-01-01 | TTL Countdown Timer | Frontend countdown, expiration warning | High |
| US-08-01-02 | Display Payment Instructions | Fetch owner's GCash/bank details | High |
| US-08-01-03 | T&C Explicit Checkbox | Legal acknowledgment UI | High |
| US-08-01-04 | Payment Proof Form | Reference, notes, file upload | Medium |

---

## Implementation Order

1. **US-08-01-02** - Payment Instructions (simplest, no new logic)
2. **US-08-01-01** - TTL Timer (requires `expiresAt` from reservation)
3. **US-08-01-03** - T&C Checkbox (UI-only, minimal backend)
4. **US-08-01-04** - Payment Proof Form (depends on US-10-02 for file upload)

---

## Current Implementation State

| Component | Status | Notes |
|-----------|--------|-------|
| `reservation.expiresAt` | Complete | Set on paid reservation create |
| `reservable_court_detail` | Complete | Has GCash/bank fields |
| `paymentProof` router | Complete | `add`, `update`, `get` endpoints |
| Payment page UI | Simplified | Needs enhancements |

### Existing Backend Infrastructure

**TTL Already Set:**
```typescript
// src/modules/reservation/use-cases/create-paid-reservation.use-case.ts
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_TTL_MINUTES); // 15 min
```

**Payment Details Available:**
```sql
-- reservable_court_detail table columns:
gcash_number, bank_name, bank_account_number, bank_account_name, payment_instructions
```

**Payment Proof Endpoints:**
```typescript
// src/modules/payment-proof/payment-proof.router.ts
paymentProof.add     // Add proof to reservation
paymentProof.update  // Update existing proof
paymentProof.get     // Get proof for reservation
```

---

## Acceptance Criteria (Parent Story)

### Full P2P Flow Complete

- Given all sub-stories are implemented
- When a player books a paid court
- Then they see countdown timer, payment instructions, T&C checkbox, and proof form
- And they can mark payment with full proof submission

### Backward Compatibility

- Given existing reservations without proof
- When owner views pending reservations
- Then reservations work as before (proof is optional)

---

## Testing Checklist (Integration)

After all sub-stories complete:

- [ ] Full flow: Reserve → View instructions → See timer → Accept T&C → Submit proof → Mark paid
- [ ] Timer expiration correctly blocks submission
- [ ] Payment instructions display for courts with details
- [ ] Fallback for courts without payment details
- [ ] T&C must be checked before submission
- [ ] Proof fields are optional
- [ ] Proof saved correctly to `payment_proof` table
- [ ] Owner can see proof (via US-08-02)

---

## References

- PRD: Section 7 Journey 3 (Paid Court Booking)
- PRD: Section 8.4 (TTL Rules)
- PRD: Section 17 (Legal & Liability)
- Simplified: `06-court-reservation/06-02-player-books-paid-court.md`
- File Upload: `10-asset-uploads/10-02-player-uploads-payment-proof.md`
- Payment Page: `src/app/(auth)/reservations/[id]/payment/page.tsx`
