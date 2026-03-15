# 07-99: Deferred Items - Owner Confirmation

## Overview

Items deferred from the 07-owner-confirmation domain to maintain a simplified MVP flow. These features are captured in `08-p2p-reservation-confirmation` for future implementation.

---

## Deferred to 08-p2p-reservation-confirmation

| Feature | PRD Reference | Priority |
|---------|---------------|----------|
| Payment proof display | Journey 4 Step 2 | High |
| P2P verification flow | Journey 3-4 | High |
| Reference number display | Journey 3 Step 8 | Medium |
| Payment notes display | Journey 3 Step 8 | Medium |

---

## Payment Proof Display

**PRD Requirement (Journey 4 Step 2):**
> Views reservation details - Show player info, slot, payment proof

**Current simplified flow:**
- Owner sees player info, court, slot, amount
- No payment proof displayed

**Future implementation (08-p2p):**
- Display reference number if provided
- Display payment notes if provided
- Display uploaded screenshot if provided
- Help owner verify payment was actually made

---

## P2P Verification Flow

**Full P2P flow (deferred):**
1. Player sees payment instructions (GCash/bank details)
2. Player uploads proof after paying
3. Owner sees proof and verifies
4. Owner confirms with confidence

**Current simplified flow:**
1. Player clicks "I Have Paid"
2. Owner confirms based on trust/external communication

---

## Other Deferred Items

| Feature | Reason | Future Domain |
|---------|--------|---------------|
| Owner-initiated cancellation | Different from "reject" | Future |
| Email notification on confirm | Post-MVP | Future |
| SMS notification | Post-MVP | Future |
| Bulk confirm/reject | Convenience feature | Future |

---

## Owner-Initiated Cancellation

**Difference from Reject:**
- **Reject:** Decline a pending (PAYMENT_MARKED_BY_USER) reservation
- **Cancel:** Cancel an already CONFIRMED reservation

**Use case:** Player booked and paid, but owner needs to cancel (emergency, double-booking, etc.)

**Considerations:**
- Refund implications (external, out of platform)
- Player notification
- Different audit trail

**Decision:** Deferred, handle manually for MVP.

---

## See Also

- `08-p2p-reservation-confirmation/08-00-overview.md` for full P2P flow specification
- PRD Section 7 Journey 4 (Owner Confirms Payment)
- PRD Section 15 (Audit Trail)
