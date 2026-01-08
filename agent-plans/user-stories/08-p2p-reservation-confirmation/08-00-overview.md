# P2P Reservation Confirmation - User Stories

## Overview

The P2P Reservation Confirmation domain captures the full peer-to-peer payment verification flow as specified in the PRD. This is a **future enhancement** domain that extends the simplified flows in `06-court-reservation` and `07-owner-confirmation`.

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

## Future Story Index

| ID | Story | Priority | Description |
|----|-------|----------|-------------|
| US-08-01 | Player Completes P2P Payment Flow | High | TTL timer, instructions, proof upload, T&C |
| US-08-02 | Owner Reviews Payment Proof | High | View proof, verify before confirming |
| US-08-03 | TTL Expiration Handling | High | Auto-expire, slot release, cron job |

**Note:** Stories are placeholders for future implementation.

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
// Run every minute
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

Stored in organization profile:

| Field | Example |
|-------|---------|
| GCash Number | 0917-123-4567 |
| GCash Name | Juan Dela Cruz |
| Bank Name | BDO |
| Bank Account | 1234-5678-9012 |
| Bank Account Name | Juan Dela Cruz Sports |

**Display on payment page:**
```
Pay via one of the following methods:

GCash: 0917-123-4567 (Juan Dela Cruz)
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
   - Screenshot (optional file upload)
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

## Backend Requirements

### Player Side

| Endpoint | Status | Enhancement |
|----------|--------|-------------|
| `reservation.markPayment` | Exists | Add proof fields |

**Enhanced input:**
```typescript
{
  reservationId: string,
  termsAccepted: true,
  referenceNumber?: string,
  notes?: string,
  fileUrl?: string  // From file upload
}
```

### Owner Side

| Endpoint | Status | Enhancement |
|----------|--------|-------------|
| `reservationOwner.getForOrganization` | Exists | Include payment proof |

**Enhanced response:**
```typescript
{
  // ... existing fields
  paymentProof?: {
    referenceNumber: string | null,
    notes: string | null,
    fileUrl: string | null,
    createdAt: string
  }
}
```

### Expiration

| Requirement | Implementation |
|-------------|----------------|
| Cron job | Supabase pg_cron or external scheduler |
| Frequency | Every 1-5 minutes |
| Action | Find expired, transition status, release slot |

---

## Frontend Requirements

### Payment Page Enhancements

| Feature | Component |
|---------|-----------|
| Countdown timer | `CountdownTimer` component |
| Payment instructions | `PaymentInstructions` component |
| Proof upload form | `PaymentProofForm` component |
| T&C checkbox | Checkbox with modal link |

### Owner Reservation Detail

| Feature | Component |
|---------|-----------|
| Payment proof display | `PaymentProofCard` component |
| Reference number | Text display |
| Notes | Text display |
| Screenshot | Image display with zoom |

---

## Implementation Priority

| Phase | Stories | Focus |
|-------|---------|-------|
| 1 | US-08-03 | TTL expiration (backend) |
| 2 | US-08-01 | Player payment flow UI |
| 3 | US-08-02 | Owner proof review UI |

**Rationale:** TTL is critical for slot integrity. UI can follow.

---

## Dependencies

| Depends On | Reason |
|------------|--------|
| 06-court-reservation | Basic reservation flow |
| 07-owner-confirmation | Basic confirmation flow |
| Organization profile | Payment details storage |
| File upload service | Screenshot storage |

---

## Summary

- **Domain Purpose:** Full P2P payment verification flow
- **Current Status:** Overview only (future implementation)
- **Stories:** 3 planned
- **Key Features:** TTL, payment instructions, proof upload, T&C
- **PRD Alignment:** Section 7 Journey 3, Section 8.3-8.4, Section 17
