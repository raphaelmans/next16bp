# Phase 1: Backend Verification

**Module ID:** 1A  
**Estimated Time:** 1 hour  
**Dependencies:** None

---

## Objective

Verify that existing backend endpoints work correctly for the reservation flow before wiring frontend.

---

## Endpoints to Verify

### 1. `timeSlot.getAvailable`

**Purpose:** Fetch available slots for court detail page.

**Test:**
```bash
# Via Supabase SQL or API client
# Should return only AVAILABLE slots
```

**Expected:**
- Returns slots with status = AVAILABLE only
- Includes priceCents, currency for pricing display
- Filtered by date range

### 2. `reservation.create`

**Purpose:** Create a reservation for a slot.

**Test Cases:**

**Free Court:**
```typescript
// Input
{ timeSlotId: "uuid-of-free-slot" }

// Expected Output
{
  id: "new-reservation-id",
  status: "CONFIRMED",
  timeSlotId: "...",
  playerId: "current-user-id"
}
// Slot status should change to BOOKED
```

**Paid Court:**
```typescript
// Input
{ timeSlotId: "uuid-of-paid-slot" }

// Expected Output
{
  id: "new-reservation-id",
  status: "AWAITING_PAYMENT",
  timeSlotId: "...",
  playerId: "current-user-id",
  expiresAt: "timestamp-15-min-from-now"
}
// Slot status should change to HELD
```

### 3. `reservation.markPayment`

**Purpose:** Player marks payment as complete.

**Test:**
```typescript
// Input
{
  reservationId: "reservation-with-awaiting-payment-status",
  termsAccepted: true
}

// Expected Output
{
  id: "...",
  status: "PAYMENT_MARKED_BY_USER"
}
// Slot status should remain HELD
```

**Error Case:**
```typescript
// Input with termsAccepted: false
{ reservationId: "...", termsAccepted: false }

// Expected: Validation error
```

### 4. `reservation.getById`

**Purpose:** Fetch reservation details for confirmation/payment pages.

**Test:**
```typescript
// Input
{ reservationId: "existing-reservation-id" }

// Expected Output
{
  id: "...",
  status: "...",
  timeSlotId: "...",
  playerId: "...",
  // Player snapshot
  playerNameSnapshot: "...",
  playerEmailSnapshot: "...",
  playerPhoneSnapshot: "...",
  // Timestamps
  createdAt: "...",
  expiresAt: "..." // for paid
}
```

### 5. `reservation.getMy`

**Purpose:** List player's reservations.

**Test:**
```typescript
// Input
{ limit: 10, offset: 0 }

// Expected Output
[
  { id: "...", status: "CONFIRMED", ... },
  { id: "...", status: "PAYMENT_MARKED_BY_USER", ... }
]
```

---

## Verification Checklist

### Free Court Flow

1. [ ] Create slot with priceCents = NULL
2. [ ] Verify slot appears in `getAvailable`
3. [ ] Create reservation
4. [ ] Verify reservation status = CONFIRMED
5. [ ] Verify slot status = BOOKED
6. [ ] Verify slot no longer in `getAvailable`

### Paid Court Flow

1. [ ] Create slot with priceCents > 0
2. [ ] Verify slot appears in `getAvailable` with price
3. [ ] Create reservation
4. [ ] Verify reservation status = AWAITING_PAYMENT
5. [ ] Verify slot status = HELD
6. [ ] Verify slot no longer in `getAvailable`
7. [ ] Call markPayment
8. [ ] Verify reservation status = PAYMENT_MARKED_BY_USER
9. [ ] Verify slot status still HELD

### Edge Cases

1. [ ] Double-booking prevention (slot already HELD)
2. [ ] Non-existent slot (404 error)
3. [ ] Slot on different owner's court (should still work - player can book)
4. [ ] Missing player profile data (graceful handling)

---

## Manual Testing Script

```typescript
// Run in development environment or test suite

// Setup
const courtId = "test-court-id";
const freeSlotId = "test-free-slot-id";
const paidSlotId = "test-paid-slot-id";

// Test 1: Create free reservation
const freeRes = await trpc.reservation.create({ timeSlotId: freeSlotId });
console.assert(freeRes.status === "CONFIRMED", "Free slot should auto-confirm");

// Test 2: Create paid reservation
const paidRes = await trpc.reservation.create({ timeSlotId: paidSlotId });
console.assert(paidRes.status === "AWAITING_PAYMENT", "Paid slot should await payment");

// Test 3: Mark payment
const markedRes = await trpc.reservation.markPayment({
  reservationId: paidRes.id,
  termsAccepted: true
});
console.assert(markedRes.status === "PAYMENT_MARKED_BY_USER", "Should transition to marked");

// Test 4: Get reservation
const fetchedRes = await trpc.reservation.getById({ reservationId: paidRes.id });
console.assert(fetchedRes.id === paidRes.id, "Should fetch correctly");
```

---

## Potential Issues to Watch

### 1. Player Profile Requirement

PRD states minimum profile needed (displayName + email or phone). Verify:
- Backend checks profile completeness
- Returns appropriate error if incomplete
- Frontend can catch and display error

### 2. Slot Availability Race Condition

If two users try to book same slot:
- First succeeds, slot → HELD/BOOKED
- Second should fail with "Slot no longer available"

Verify error message is user-friendly.

### 3. Terms Acceptance

Backend requires `termsAccepted: true`. Verify:
- False value rejected
- Missing value rejected
- Error message clear

---

## Backend Code Review Points

If any issues found, check:

1. **Reservation Service:**
   - `src/modules/reservation/services/reservation.service.ts`
   - Free vs paid detection logic
   - Status transitions

2. **Reservation Use Cases:**
   - `src/modules/reservation/use-cases/create-free-reservation.use-case.ts`
   - `src/modules/reservation/use-cases/create-paid-reservation.use-case.ts`

3. **DTOs:**
   - `src/modules/reservation/dtos/create-reservation.dto.ts`
   - `src/modules/reservation/dtos/mark-payment.dto.ts`

---

## Sign-off

- [ ] All endpoints return expected responses
- [ ] Status transitions work correctly
- [ ] Slot status updates correctly
- [ ] Error handling appropriate
- [ ] Ready for frontend integration
