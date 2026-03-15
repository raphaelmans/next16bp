# US-08-02: Owner Reviews Payment Proof

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**PRD Reference:** Section 7 Journey 4  
**Enhances:** US-07-01, US-07-02 (Owner Confirmation)

---

## Story

As a **court owner**, I want to **view payment proof submitted by players** so that **I can verify the payment before confirming the reservation**.

---

## Context

When players submit payment proof (reference number, notes, screenshot), owners need to see this information when reviewing pending reservations. Currently, the owner dashboard shows reservation details but not payment proof.

**Current State:**
- Owner sees player info (name, email, phone)
- Owner sees reservation status
- No payment proof displayed
- Owner confirms based on trust/external verification

**Target State:**
- Owner sees payment proof inline with reservation details
- Reference number, notes displayed as text
- Screenshot displayed as thumbnail with zoom capability

---

## Sub-Stories

| ID | Story | Focus | Priority |
|----|-------|-------|----------|
| US-08-02-01 | Backend: Include Payment Proof in Response | Enhance `reservationOwner.getForOrganization` | High |
| US-08-02-02 | Owner Dashboard: Display Payment Proof Card | UI component to show proof | High |

---

## Implementation Order

1. **US-08-02-01** - Backend enhancement (return proof with reservation)
2. **US-08-02-02** - Frontend component (display proof card)

---

## Current Implementation State

### Owner Reservation Endpoint

`reservationOwner.getForOrganization` currently returns:

```typescript
{
  id: string,
  status: string,
  playerNameSnapshot: string,
  playerEmailSnapshot: string,
  playerPhoneSnapshot: string,
  createdAt: string,
  // ... time slot details (recently enhanced)
}
```

**Missing:** Payment proof data

### Payment Proof Service

The `paymentProof.get` service exists but only allows player access:

```typescript
// src/modules/payment-proof/services/payment-proof.service.ts
// Note: "court owner check would require additional dependencies"
if (!isPlayer) {
  throw new NotReservationOwnerError();
}
```

### Solution

Include payment proof in the owner's reservation list query to avoid access control complexity.

---

## Acceptance Criteria (Parent Story)

### Proof Visible to Owner

- Given a player has submitted payment proof
- When I view the pending reservations list
- Then I see the payment proof details

### No Proof Graceful Handling

- Given a player has not submitted payment proof
- When I view the pending reservations list
- Then I see "No proof provided" indicator

---

## Testing Checklist (Integration)

After all sub-stories complete:

- [ ] Owner sees proof when player submits reference number
- [ ] Owner sees proof when player submits notes
- [ ] Owner sees screenshot thumbnail when player uploads
- [ ] Owner can zoom/view full screenshot
- [ ] "No proof provided" shown when player skips proof
- [ ] Proof display doesn't break existing confirm/reject flow

---

## References

- Parent: `07-owner-confirmation` domain
- PRD: Section 7 Journey 4 (Owner Confirms Payment)
- Payment Proof Backend: `src/modules/payment-proof/`
- Owner Reservations: `src/features/owner/hooks/use-owner-reservations.ts`
