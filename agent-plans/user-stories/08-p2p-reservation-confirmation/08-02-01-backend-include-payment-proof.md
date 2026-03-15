# US-08-02-01: Backend - Include Payment Proof in Response

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**Parent:** US-08-02 (Owner Reviews Payment Proof)

---

## Story

As the **backend system**, I need to **include payment proof data in owner reservation responses** so that **the frontend can display proof to owners**.

---

## Context

The `reservationOwner.getForOrganization` endpoint returns reservation data for owners. This story enhances it to include payment proof when available, avoiding the need for a separate access control mechanism.

**Current Response:**
```typescript
{
  id: string,
  status: string,
  playerNameSnapshot: string,
  // ... no payment proof
}
```

**Target Response:**
```typescript
{
  id: string,
  status: string,
  playerNameSnapshot: string,
  // ... existing fields
  paymentProof: {
    referenceNumber: string | null,
    notes: string | null,
    fileUrl: string | null,
    createdAt: string,
  } | null
}
```

---

## Acceptance Criteria

### Include Proof in Response

- Given a reservation has payment proof
- When owner calls `reservationOwner.getForOrganization`
- Then the response includes `paymentProof` object

### Proof Object Shape

- Given payment proof exists
- Then the response includes:
  - `referenceNumber: string | null`
  - `notes: string | null`
  - `fileUrl: string | null`
  - `createdAt: string`

### No Proof Returns Null

- Given a reservation has no payment proof
- When owner calls `reservationOwner.getForOrganization`
- Then `paymentProof` is `null`

### Scope Limited to Owner's Reservations

- Given a reservation belongs to my organization
- Then I can see its payment proof
- But I cannot see proof for other organizations' reservations

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No proof submitted | `paymentProof: null` |
| Proof with only reference | Returns reference, null for others |
| Proof with only notes | Returns notes, null for others |
| Proof with only file | Returns fileUrl, null for others |
| All proof fields filled | Returns all fields |
| Reservation not owned by organization | Not included in results |

---

## Technical Notes

### Database Query Enhancement

Join `payment_proof` table in the reservation query:

```typescript
// In ReservationOwnerRepository or Service
async getForOrganization(organizationId: string) {
  return db
    .select({
      id: reservation.id,
      status: reservation.status,
      playerNameSnapshot: reservation.playerNameSnapshot,
      playerEmailSnapshot: reservation.playerEmailSnapshot,
      playerPhoneSnapshot: reservation.playerPhoneSnapshot,
      createdAt: reservation.createdAt,
      // ... existing slot/court fields
      
      // NEW: Payment proof
      paymentProof: {
        referenceNumber: paymentProof.referenceNumber,
        notes: paymentProof.notes,
        fileUrl: paymentProof.fileUrl,
        createdAt: paymentProof.createdAt,
      },
    })
    .from(reservation)
    .innerJoin(timeSlot, eq(timeSlot.id, reservation.timeSlotId))
    .innerJoin(court, eq(court.id, timeSlot.courtId))
    .leftJoin(paymentProof, eq(paymentProof.reservationId, reservation.id))
    .where(
      and(
        eq(court.organizationId, organizationId),
        inArray(reservation.status, ['PAYMENT_MARKED_BY_USER'])
      )
    );
}
```

### Alternative: Subquery Approach

```typescript
// If join causes issues with null handling
const reservations = await getReservations(organizationId);

const reservationIds = reservations.map(r => r.id);
const proofs = await db
  .select()
  .from(paymentProof)
  .where(inArray(paymentProof.reservationId, reservationIds));

// Merge proofs into reservations
return reservations.map(r => ({
  ...r,
  paymentProof: proofs.find(p => p.reservationId === r.id) ?? null,
}));
```

### DTO Update

```typescript
// src/modules/reservation-owner/dtos/get-reservations.dto.ts
export const ReservationWithProofSchema = z.object({
  id: z.string(),
  status: z.string(),
  playerNameSnapshot: z.string().nullable(),
  playerEmailSnapshot: z.string().nullable(),
  playerPhoneSnapshot: z.string().nullable(),
  createdAt: z.string(),
  // ... existing fields
  
  paymentProof: z.object({
    referenceNumber: z.string().nullable(),
    notes: z.string().nullable(),
    fileUrl: z.string().nullable(),
    createdAt: z.string(),
  }).nullable(),
});
```

### TypeScript Types Update

After implementing, regenerate types:

```bash
npm run generate:types
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/modules/reservation-owner/repositories/reservation-owner.repository.ts` | Add left join for payment_proof |
| `src/modules/reservation-owner/dtos/` | Add paymentProof to response schema |
| `src/modules/reservation-owner/services/reservation-owner.service.ts` | If using subquery approach |

---

## Testing Checklist

- [ ] Response includes `paymentProof` when proof exists
- [ ] Response has `paymentProof: null` when no proof
- [ ] All proof fields returned correctly (reference, notes, fileUrl, createdAt)
- [ ] Owner can only see proof for their organization's reservations
- [ ] Type generation reflects new field
- [ ] Existing functionality not broken
- [ ] Performance acceptable (no N+1 queries)

---

## Dependencies

- `payment_proof` table (exists)
- `reservationOwner.getForOrganization` endpoint (exists, needs enhancement)
