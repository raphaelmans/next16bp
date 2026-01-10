# Phase 1: Backend Enhancements

**Dependencies:** None  
**Parallelizable:** Yes (1A, 1B, 1C can run in parallel)  
**User Stories:** US-08-01-02, US-08-02-01, US-08-03-01

---

## Objective

Enhance the backend to support the full P2P flow:
1. Return payment details with time slot data
2. Include payment proof in owner reservation responses
3. Configure Vercel cron job for production

---

## Module 1A: Payment Details Endpoint

**User Story:** `US-08-01-02`  
**Priority:** High

### Current State

`timeSlot.getById` returns slot data but not payment details:
```typescript
{
  id: string,
  courtId: string,
  startTime: string,
  endTime: string,
  priceCents: number,
  // MISSING: payment details
}
```

### Target State

```typescript
{
  id: string,
  courtId: string,
  startTime: string,
  endTime: string,
  priceCents: number,
  paymentDetails: {
    gcashNumber: string | null,
    bankName: string | null,
    bankAccountNumber: string | null,
    bankAccountName: string | null,
    paymentInstructions: string | null,
  } | null
}
```

### Files to Modify

| File | Change |
|------|--------|
| `src/modules/time-slot/repositories/time-slot.repository.ts` | Add join for reservable_court_detail |
| `src/modules/time-slot/dtos/time-slot.dto.ts` | Add paymentDetails to response schema |
| `src/modules/time-slot/services/time-slot.service.ts` | Pass through payment details |

### Implementation

```typescript
// In TimeSlotRepository.getById
async getById(id: string) {
  const result = await this.db
    .select({
      id: timeSlot.id,
      courtId: timeSlot.courtId,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      status: timeSlot.status,
      priceCents: timeSlot.priceCents,
      currency: timeSlot.currency,
      // Add payment details
      paymentDetails: {
        gcashNumber: reservableCourtDetail.gcashNumber,
        bankName: reservableCourtDetail.bankName,
        bankAccountNumber: reservableCourtDetail.bankAccountNumber,
        bankAccountName: reservableCourtDetail.bankAccountName,
        paymentInstructions: reservableCourtDetail.paymentInstructions,
      },
    })
    .from(timeSlot)
    .innerJoin(court, eq(court.id, timeSlot.courtId))
    .leftJoin(reservableCourtDetail, eq(reservableCourtDetail.courtId, court.id))
    .where(eq(timeSlot.id, id))
    .limit(1);
    
  return result[0] ?? null;
}
```

### Testing Checklist

- [ ] `timeSlot.getById` returns paymentDetails when configured
- [ ] Returns null paymentDetails for curated courts
- [ ] Returns null for fields not configured
- [ ] Type generation includes new field

---

## Module 1B: Owner Proof Response

**User Story:** `US-08-02-01`  
**Priority:** High

### Current State

`reservationOwner.getForOrganization` returns reservation without proof:
```typescript
{
  id: string,
  status: string,
  playerNameSnapshot: string,
  // ... no payment proof
}
```

### Target State

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

### Files to Modify

| File | Change |
|------|--------|
| `src/modules/reservation-owner/repositories/reservation-owner.repository.ts` | Add left join for payment_proof |
| `src/modules/reservation-owner/dtos/reservation-owner.dto.ts` | Add paymentProof to response |

### Implementation

```typescript
// In ReservationOwnerRepository.getForOrganization
async getForOrganization(organizationId: string) {
  const result = await this.db
    .select({
      // ... existing fields
      id: reservation.id,
      status: reservation.status,
      playerNameSnapshot: reservation.playerNameSnapshot,
      playerEmailSnapshot: reservation.playerEmailSnapshot,
      playerPhoneSnapshot: reservation.playerPhoneSnapshot,
      createdAt: reservation.createdAt,
      // Add payment proof
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
    
  return result;
}
```

### Null Handling Note

When using left join, null payment_proof rows need special handling. Consider:

```typescript
// Post-process to convert empty proof objects to null
return result.map(r => ({
  ...r,
  paymentProof: r.paymentProof?.referenceNumber || r.paymentProof?.notes || r.paymentProof?.fileUrl
    ? r.paymentProof
    : null
}));
```

### Testing Checklist

- [ ] Response includes paymentProof when proof exists
- [ ] Response has paymentProof: null when no proof
- [ ] All proof fields returned correctly
- [ ] Type generation includes new field

---

## Module 1C: Vercel Cron Configuration

**User Story:** `US-08-03-01`  
**Priority:** High

### Current State

- Cron endpoint exists at `/api/cron/expire-reservations`
- Protected by CRON_SECRET
- Not configured in Vercel

### Target State

- Cron runs every minute on Vercel
- CRON_SECRET set in environment variables

### Files to Create/Modify

| File | Action |
|------|--------|
| `vercel.json` | Add crons configuration |
| Vercel Dashboard | Add CRON_SECRET environment variable |

### Implementation

**vercel.json:**
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

**Generate CRON_SECRET:**
```bash
openssl rand -hex 32
```

### Verification Steps

1. Deploy to Vercel
2. Check Vercel dashboard for cron configuration
3. Create test expired reservation
4. Wait for cron execution (check logs)
5. Verify reservation expired

### Testing Checklist

- [ ] `vercel.json` includes cron configuration
- [ ] CRON_SECRET set in Vercel environment
- [ ] Cron executes on schedule (check Vercel logs)
- [ ] Expired reservations transition correctly
- [ ] Time slots released to AVAILABLE

---

## Phase Completion Checklist

- [ ] Module 1A: Payment details in slot response
- [ ] Module 1B: Payment proof in owner response
- [ ] Module 1C: Vercel cron configured
- [ ] No TypeScript errors
- [ ] Types regenerated

---

## Handoff Notes

- After Phase 1 complete, Phase 2 (payment page) and Phase 3 (owner proof) can start
- Module 1A enables: US-08-01-02 (payment instructions display)
- Module 1B enables: US-08-02-02 (owner proof card)
- Module 1C enables: US-08-03-01 verification complete
