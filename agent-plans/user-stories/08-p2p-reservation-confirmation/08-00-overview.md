# P2P Reservation Confirmation - User Stories

## Overview

The P2P Reservation Confirmation domain captures the full peer-to-peer payment verification flow as specified in the PRD. This domain **enhances** the simplified flows in `06-court-reservation` and `07-owner-confirmation` with:

- 15-minute TTL countdown timer
- Owner's payment instructions display (GCash, bank details)
- Explicit Terms & Conditions acknowledgment
- Payment proof submission (reference number, notes, screenshot)
- Owner payment proof review

KudosCourts uses a P2P payment model where:
- Players pay court owners directly (GCash, bank transfer, cash)
- KudosCourts does not process or handle payments
- The platform facilitates reservation tracking and payment confirmation
- Legal disclaimers protect the platform from payment disputes

This domain implements:
- PRD Section 7 Journey 3 (full P2P flow)
- PRD Section 8.3-8.4 (paid court lifecycle, TTL rules)
- PRD Section 17 (legal & liability requirements)

---

## Current State (Simplified)

Domains 06 and 07 implement a simplified version:

| Feature | Simplified (06/07) | Full P2P (08) |
|---------|-------------------|---------------|
| Reserve paid slot | Yes | Yes |
| Mark as paid | Button only | With proof upload |
| Payment instructions | Generic text | Owner's payment details |
| TTL timer | No | 15 minutes |
| Expiration handling | No | Auto-cancel, slot release |
| T&C acknowledgement | Backend flag | Explicit UI checkbox |
| Payment proof | No | Reference, notes, image |
| Owner sees proof | No | Yes |

---

## PRD References

| Section | Topic |
|---------|-------|
| Section 7 Journey 3 | Full paid court booking flow |
| Section 8.3 | Paid court reservation lifecycle |
| Section 8.4 | TTL (Time-to-Live) rules |
| Section 17 | Legal & liability requirements |
| Section 3.2 | No payment processing constraint |

---

## Story Index

| ID | Story | Status | Description |
|----|-------|--------|-------------|
| **US-08-01** | **Player Completes P2P Payment Flow** | Active | Parent story for player payment enhancements |
| US-08-01-01 | Payment Page: TTL Countdown Timer | Active | Countdown timer with expiration warning |
| US-08-01-02 | Payment Page: Display Payment Instructions | Active | Show owner's GCash/bank details |
| US-08-01-03 | Payment Page: T&C Explicit Checkbox | Active | Legal acknowledgment with disclaimer |
| US-08-01-04 | Payment Page: Payment Proof Form | Active | Reference number, notes (file upload via US-10-02) |
| **US-08-02** | **Owner Reviews Payment Proof** | Active | Parent story for owner proof review |
| US-08-02-01 | Backend: Include Payment Proof in Response | Active | Enhance `reservationOwner.getForOrganization` |
| US-08-02-02 | Owner Dashboard: Display Payment Proof Card | Active | UI to show reference, notes, screenshot |
| **US-08-03** | **TTL Expiration Handling** | Active | Parent story for expiration flow |
| US-08-03-01 | Backend: Verify Cron Job E2E | Active | Test cron endpoint, configure Vercel |
| US-08-03-02 | Frontend: Expired Reservation UI States | Active | UI for expired reservations |

---

## Implementation Priority

| Phase | Stories | Focus |
|-------|---------|-------|
| 1 | US-08-03-01 | TTL cron verification (backend) |
| 2 | US-08-01-02 | Payment instructions display (simplest frontend) |
| 3 | US-08-01-01 | TTL countdown timer (uses existing expiresAt) |
| 4 | US-08-01-03 | T&C checkbox (UI-only) |
| 5 | US-08-01-04 | Payment proof form (depends on US-10-02 for file) |
| 6 | US-08-02-01, US-08-02-02 | Owner proof review |
| 7 | US-08-03-02 | Expired reservation UI |

**Rationale:** TTL is critical for slot integrity. Backend first, then frontend enhancements.

---

## Current Implementation State

### Already Implemented (Backend)

| Component | Status | Location |
|-----------|--------|----------|
| `reservation.expiresAt` column | Complete | Set on paid reservation create |
| `payment_proof` table | Complete | `file_url`, `reference_number`, `notes` |
| `paymentProof` router | Complete | `add`, `update`, `get` endpoints |
| `reservable_court_detail` | Complete | Has `gcash_number`, `bank_name`, etc. |
| Cron endpoint | Complete | `/api/cron/expire-reservations` |
| Audit trail | Complete | `reservation_event` table |

### Not Yet Implemented (Frontend)

| Component | Status | Notes |
|-----------|--------|-------|
| Countdown timer | Missing | No TTL countdown UI |
| Payment instructions display | Missing | Shows generic text, not owner's GCash/bank |
| Payment proof form | Missing | No reference/notes/upload fields |
| T&C explicit checkbox | Missing | Just disclaimer text, no checkbox |
| Owner proof review | Missing | Owner can't see payment proof |

### Not Yet Implemented (Backend)

| Component | Status | Notes |
|-----------|--------|-------|
| Get payment details for slot | Missing | Need to fetch GCash/bank from `reservable_court_detail` |
| Include payment proof in owner response | Missing | Owner can't see proof when reviewing |

---

## Full P2P Flow

### Player Journey (Journey 3)

```
1. Player searches by location
        │
        ▼
2. Selects a paid court
        │
        ▼
3. Picks date and time slot
        │
        ▼
4. Initiates reservation
        │
        ├── Slot status: HELD
        ├── Reservation: AWAITING_PAYMENT
        ├── expiresAt: NOW() + 15 minutes
        │
        ▼
5. Views payment instructions
        │
        ├── Display: GCash number, bank account, account name
        ├── Display: Amount due
        ├── Display: Countdown timer (15 min)
        │
        ▼
6. Pays externally
        │
        └── (Outside KudosCourts - GCash, bank, cash)
        │
        ▼
7. Accepts T&C, clicks "I Have Paid"
        │
        ├── Checkbox: "I have read and accept the Terms & Conditions"
        ├── Checkbox: "I acknowledge KudosCourts does not process payments"
        │
        ▼
8. (Optional) Uploads proof
        │
        ├── Reference number input
        ├── Notes/comments
        ├── Screenshot upload (optional)
        │
        ▼
9. Awaits owner confirmation
        │
        └── Status: PAYMENT_MARKED_BY_USER
        │
        ▼
10. Owner confirms → CONFIRMED
        │
        └── Slot: BOOKED
```

### Owner Journey (Journey 4)

```
1. Owner opens dashboard
        │
        ▼
2. Views pending reservations
        │
        ├── Player info (name, email, phone)
        ├── Slot details (court, date, time, amount)
        ├── Payment proof (reference, notes, screenshot)
        │
        ▼
3. Verifies payment externally
        │
        └── (Checks GCash, bank statement)
        │
        ▼
4. Confirms or rejects
        │
        ├── Confirm → CONFIRMED, BOOKED
        └── Reject → CANCELLED, AVAILABLE
```

---

## TTL (Time-to-Live) Rules

Per PRD Section 8.4:

| Rule | Value |
|------|-------|
| Payment window | 15 minutes |
| Slot hold | Soft lock during payment window |
| Expiration behavior | Slot released, reservation EXPIRED |
| Same-day booking | Permitted |

### TTL Implementation

**On reservation create:**
```typescript
expiresAt = new Date(Date.now() + 15 * 60 * 1000)
```

**Background job (cron):**
```typescript
// Run every minute - already implemented at /api/cron/expire-reservations
const expired = await findExpiredReservations();
for (const reservation of expired) {
  await transitionToExpired(reservation);
  await releaseSlot(reservation.timeSlotId);
}
```

**UI countdown:**
```typescript
const remaining = expiresAt - Date.now();
// Display: "12:34 remaining"
// Warning at 5 min: "Time running out!"
// At 0: "Reservation expired"
```

---

## Payment Instructions

Stored in `reservable_court_detail` table:

| Field | Example |
|-------|---------|
| gcash_number | 0917-123-4567 |
| bank_name | BDO |
| bank_account_number | 1234-5678-9012 |
| bank_account_name | Juan Dela Cruz Sports |
| payment_instructions | (custom text) |

**Display on payment page:**
```
Pay via one of the following methods:

GCash: 0917-123-4567
Bank: BDO 1234-5678-9012 (Juan Dela Cruz Sports)
Cash: Pay at the court before your slot
```

---

## Payment Proof

### Database Schema

Table: `payment_proof` (exists)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| reservationId | uuid | FK to reservation |
| referenceNumber | text | Optional payment reference |
| notes | text | Optional notes from player |
| fileUrl | text | Optional uploaded screenshot |
| createdAt | timestamp | When proof was submitted |

### Upload Flow

1. Player fills optional fields:
   - Reference number (e.g., "GC-12345678")
   - Notes (e.g., "Paid via GCash at 2:30pm")
   - Screenshot (optional file upload via US-10-02)
2. Submit with "I Have Paid"
3. Stored in `payment_proof` table
4. Owner sees proof when reviewing reservation

---

## Legal Requirements

Per PRD Section 17:

### Platform Neutrality

> KudosCourts does not process or verify payments  
> Payment disputes are between player and court owner  
> KudosCourts is not liable for booking disputes

### User Acknowledgement (Before marking paid)

- [ ] Accept Terms & Conditions via explicit checkbox
- [ ] Acknowledge the payment disclaimer

### T&C Text

```
□ I have read and accept the Terms & Conditions and acknowledge that:
  - KudosCourts does not process or verify payments
  - Payment disputes are between me and the court owner
  - KudosCourts is not liable for booking disputes
```

### Audit Trail

All payment confirmations logged:
- Player acknowledgement timestamp
- What they agreed to
- Supports dispute investigation

---

## Dependencies

| Depends On | Reason |
|------------|--------|
| 06-court-reservation | Basic reservation flow |
| 07-owner-confirmation | Basic confirmation flow |
| 10-asset-uploads (US-10-02) | Payment proof file upload |
| Organization profile | Payment details storage |

---

## Document Index

| Document | Description |
|----------|-------------|
| `08-00-overview.md` | This file |
| `08-01-player-completes-p2p-payment-flow.md` | Parent: Player payment flow |
| `08-01-01-payment-page-ttl-countdown-timer.md` | Countdown timer |
| `08-01-02-payment-page-display-payment-instructions.md` | Payment instructions |
| `08-01-03-payment-page-tc-explicit-checkbox.md` | T&C checkbox |
| `08-01-04-payment-page-payment-proof-form.md` | Proof form |
| `08-02-owner-reviews-payment-proof.md` | Parent: Owner reviews proof |
| `08-02-01-backend-include-payment-proof.md` | Backend enhancement |
| `08-02-02-owner-display-payment-proof-card.md` | Proof card UI |
| `08-03-ttl-expiration-handling.md` | Parent: TTL expiration |
| `08-03-01-verify-cron-job-e2e.md` | Cron verification |
| `08-03-02-expired-reservation-ui-states.md` | Expired UI |

---

## Summary

- **Domain Purpose:** Full P2P payment verification flow
- **Total Stories:** 11 (3 parent + 8 sub-stories)
- **Status:** Active
- **Key Features:** TTL, payment instructions, proof upload, T&C
- **PRD Alignment:** Section 7 Journey 3, Section 8.3-8.4, Section 17
