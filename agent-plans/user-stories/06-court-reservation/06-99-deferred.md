# 06-99: Deferred Items - Court Reservation

## Overview

Items deferred from the 06-court-reservation domain to enable a simplified MVP flow. These features are captured in `08-p2p-reservation-confirmation` for future implementation.

---

## Deferred to 08-p2p-reservation-confirmation

| Feature | PRD Reference | Priority |
|---------|---------------|----------|
| 15-minute TTL timer | Section 8.4 | High |
| Countdown UI on payment page | Section 8.4 | High |
| Payment instructions display | Journey 3 Step 5 | High |
| Payment proof upload | Journey 3 Step 8 | Medium |
| Reference number input | Journey 3 Step 8 | Medium |
| Expiration handling (cron job) | Section 8.4 | High |
| T&C checkbox UI | Section 17.3 | Medium |
| Slot auto-release on expiry | Section 8.4 | High |

---

## TTL (Time-to-Live) Timer

**PRD Requirement (Section 8.4):**
> Payment window: 15 minutes  
> Expiration behavior: Slot released, reservation marked EXPIRED

**Current simplified flow:**
- No timer displayed
- No automatic expiration
- Slot stays HELD until owner action

**Future implementation (08-p2p):**
- Display countdown on payment page
- Background job checks for expired reservations
- Auto-transition: AWAITING_PAYMENT → EXPIRED after 15 min
- Slot auto-release: HELD → AVAILABLE

---

## Payment Instructions

**PRD Requirement (Journey 3 Step 5):**
> Views payment instructions - Display GCash/bank details

**Current simplified flow:**
- Generic text: "Pay via GCash, bank, or cash"
- No specific account details

**Future implementation (08-p2p):**
- Organization payment details stored in organization_profile
- Display GCash number, bank account, account name
- Copy-to-clipboard functionality

---

## Payment Proof Upload

**PRD Requirement (Journey 3 Step 8):**
> (Optional) Uploads proof - Store payment proof

**Current simplified flow:**
- Player clicks "I Have Paid" with no proof
- `termsAccepted: true` is the only requirement

**Future implementation (08-p2p):**
- Reference number input field
- Notes/comments field
- Optional screenshot upload
- Stored in `payment_proof` table

---

## T&C Acknowledgement

**PRD Requirement (Section 17.3):**
> Before marking payment as complete, players must:
> - Accept Terms & Conditions via explicit checkbox
> - Acknowledge the payment disclaimer

**Current simplified flow:**
- Backend requires `termsAccepted: true`
- Frontend may auto-send this flag

**Future implementation (08-p2p):**
- Explicit checkbox UI
- Link to Terms & Conditions
- Payment disclaimer text displayed
- Checkbox must be checked before button enabled

---

## See Also

- `08-p2p-reservation-confirmation/08-00-overview.md` for full P2P flow specification
- PRD Section 8 (Reservation System)
- PRD Section 17 (Legal & Liability Requirements)
