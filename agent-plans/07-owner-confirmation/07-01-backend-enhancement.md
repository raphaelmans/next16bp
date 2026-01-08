# Phase 1: Backend Enhancement

**Dependencies:** None  
**Parallelizable:** No (sequential within phase)  
**User Stories:** US-07-01, US-07-02

---

## Objective

Enhance `reservationOwner.getForOrganization` to return enriched reservation data including court name, slot times, and pricing.

---

## Current State

### Service Method (`reservation-owner.service.ts:285-345`)

```typescript
async getForOrganization(
  userId: string,
  filters: GetOrgReservationsDTO,
): Promise<ReservationRecord[]> {
  // Currently iterates through courts and slots - N+1 problem
  // Returns plain ReservationRecord without slot/court details
}
```

### Current Response Type

```typescript
// ReservationRecord from schema
{
  id: string;
  timeSlotId: string;
  playerId: string;
  status: string;
  playerNameSnapshot: string | null;
  playerEmailSnapshot: string | null;
  playerPhoneSnapshot: string | null;
  cancellationReason: string | null;
  createdAt: string | null;
  // NO: courtName, slotStartTime, slotEndTime, amountCents
}
```

---

## Target State

### Enhanced Response Type

```typescript
// New enriched type
interface ReservationWithDetails {
  // Base reservation fields
  id: string;
  status: ReservationStatus;
  playerNameSnapshot: string | null;
  playerEmailSnapshot: string | null;
  playerPhoneSnapshot: string | null;
  cancellationReason: string | null;
  createdAt: string | null;
  
  // Enriched fields (from joins)
  courtId: string;
  courtName: string;
  slotStartTime: string;  // ISO datetime
  slotEndTime: string;    // ISO datetime
  amountCents: number | null;
  currency: string | null;
}
```

---

## Implementation Steps

### Step 1: Add DTO Types

**File:** `src/modules/reservation/dtos/reservation-owner.dto.ts`

```typescript
// Add after existing DTOs

export const ReservationWithDetailsSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "CREATED",
    "AWAITING_PAYMENT",
    "PAYMENT_MARKED_BY_USER",
    "CONFIRMED",
    "EXPIRED",
    "CANCELLED",
  ]),
  playerNameSnapshot: z.string().nullable(),
  playerEmailSnapshot: z.string().nullable(),
  playerPhoneSnapshot: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.string().nullable(),
  
  // Enriched fields
  courtId: z.string().uuid(),
  courtName: z.string(),
  slotStartTime: z.string(),
  slotEndTime: z.string(),
  amountCents: z.number().nullable(),
  currency: z.string().nullable(),
});

export type ReservationWithDetails = z.infer<typeof ReservationWithDetailsSchema>;
```

### Step 2: Add Repository Method

**File:** `src/modules/reservation/repositories/reservation.repository.ts`

Add a new method that performs the join efficiently:

```typescript
/**
 * Get reservations with slot and court details for an organization
 * Uses JOINs to avoid N+1 queries
 */
async findWithDetailsByOrganization(
  organizationId: string,
  filters: {
    courtId?: string;
    status?: string;
    limit: number;
    offset: number;
  },
  ctx?: RequestContext,
): Promise<ReservationWithDetails[]> {
  const db = ctx?.tx ?? this.db;
  
  // Build query with joins
  const query = db
    .select({
      id: reservation.id,
      status: reservation.status,
      playerNameSnapshot: reservation.playerNameSnapshot,
      playerEmailSnapshot: reservation.playerEmailSnapshot,
      playerPhoneSnapshot: reservation.playerPhoneSnapshot,
      cancellationReason: reservation.cancellationReason,
      createdAt: reservation.createdAt,
      courtId: court.id,
      courtName: court.name,
      slotStartTime: timeSlot.startTime,
      slotEndTime: timeSlot.endTime,
      amountCents: timeSlot.priceAmountCents,
      currency: timeSlot.priceCurrency,
    })
    .from(reservation)
    .innerJoin(timeSlot, eq(reservation.timeSlotId, timeSlot.id))
    .innerJoin(court, eq(timeSlot.courtId, court.id))
    .where(
      and(
        eq(court.organizationId, organizationId),
        filters.courtId ? eq(court.id, filters.courtId) : undefined,
        filters.status ? eq(reservation.status, filters.status) : undefined,
      ),
    )
    .orderBy(desc(reservation.createdAt))
    .limit(filters.limit)
    .offset(filters.offset);

  const results = await query;
  
  return results.map((r) => ({
    ...r,
    slotStartTime: r.slotStartTime?.toISOString() ?? "",
    slotEndTime: r.slotEndTime?.toISOString() ?? "",
    createdAt: r.createdAt?.toISOString() ?? null,
  }));
}
```

### Step 3: Update Service Interface

**File:** `src/modules/reservation/services/reservation-owner.service.ts`

Update the interface and method:

```typescript
// Update interface
export interface IReservationOwnerService {
  // ... existing methods
  getForOrganization(
    userId: string,
    filters: GetOrgReservationsDTO,
  ): Promise<ReservationWithDetails[]>;  // Changed return type
}

// Update implementation
async getForOrganization(
  userId: string,
  filters: GetOrgReservationsDTO,
): Promise<ReservationWithDetails[]> {
  // Verify user owns this organization
  const org = await this.organizationRepository.findById(
    filters.organizationId,
  );
  if (!org || org.ownerUserId !== userId) {
    throw new NotOrganizationOwnerError();
  }

  // Use new repository method with joins
  return this.reservationRepository.findWithDetailsByOrganization(
    filters.organizationId,
    {
      courtId: filters.courtId,
      status: filters.status,
      limit: filters.limit,
      offset: filters.offset,
    },
  );
}
```

### Step 4: Update Router (Optional Type Safety)

**File:** `src/modules/reservation/reservation-owner.router.ts`

The router doesn't need changes if using TypeScript inference, but you can add explicit output validation:

```typescript
getForOrganization: protectedProcedure
  .input(GetOrgReservationsSchema)
  .output(z.array(ReservationWithDetailsSchema))  // Optional: explicit output
  .query(async ({ input, ctx }) => {
    // ... existing code
  }),
```

---

## Database Query

The repository method generates this SQL:

```sql
SELECT 
  r.id,
  r.status,
  r.player_name_snapshot,
  r.player_email_snapshot,
  r.player_phone_snapshot,
  r.cancellation_reason,
  r.created_at,
  c.id as court_id,
  c.name as court_name,
  ts.start_time as slot_start_time,
  ts.end_time as slot_end_time,
  ts.price_amount_cents as amount_cents,
  ts.price_currency as currency
FROM reservation r
INNER JOIN time_slot ts ON r.time_slot_id = ts.id
INNER JOIN court c ON ts.court_id = c.id
WHERE c.organization_id = $1
  AND ($2::uuid IS NULL OR c.id = $2)
  AND ($3::text IS NULL OR r.status = $3)
ORDER BY r.created_at DESC
LIMIT $4 OFFSET $5;
```

---

## Testing Checklist

- [ ] Repository method returns enriched data
- [ ] Court name is populated
- [ ] Slot start/end times are ISO strings
- [ ] Amount and currency from slot
- [ ] Status filter works
- [ ] Court filter works
- [ ] Pagination works
- [ ] Ownership verification still works
- [ ] TypeScript compiles without errors
- [ ] Existing confirm/reject endpoints still work

---

## Files to Modify

| File | Change |
|------|--------|
| `src/modules/reservation/dtos/reservation-owner.dto.ts` | Add `ReservationWithDetails` type |
| `src/modules/reservation/repositories/reservation.repository.ts` | Add `findWithDetailsByOrganization` method |
| `src/modules/reservation/services/reservation-owner.service.ts` | Update `getForOrganization` to use new repository method |

---

## Handoff Notes

After completing Phase 1:
1. Run `npm run build` to verify no TypeScript errors
2. Test the endpoint manually using tRPC panel or curl
3. Proceed to Phase 2 (Frontend Hooks)
